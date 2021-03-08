import crypto from 'crypto'
import _ from 'lodash'
import { BotState, Data, RawData, Test } from '../backend/typings'

export async function splitTrainToTrainAndTest(state: BotState) {
  // Backup the real intent folder
  if (!(await state.ghost.fileExists('./', 'raw_intents'))) {
    const intentsFiles = await state.ghost.directoryListing('./intents', '*.json')
    for (const file of intentsFiles) {
      const intentData = await state.ghost.readFileAsObject<RawData>('./intents', file)
      await state.ghost.upsertFile('./raw_intents', file, JSON.stringify(intentData, undefined, 2))
    }
  }
  // In the new
  const intentsFiles = await state.ghost.directoryListing('./raw_intents', '*.json')
  let tests: Test[] = []
  for (const file of intentsFiles) {
    const intentDatas = await state.ghost.readFileAsObject<RawData>('./raw_intents', file)
    const languages = Object.keys(intentDatas.utterances)
    for (const lang of languages) {
      const test_utts = _.sampleSize(intentDatas.utterances[lang], _.floor(intentDatas.utterances[lang].length / 4))
      const train_utts = intentDatas.utterances[lang].filter(s => !test_utts.includes(s))
      intentDatas.utterances[lang] = train_utts
      tests = tests.concat(
        test_utts.map(s => {
          return {
            id: crypto
              .createHash('md5')
              .update(s)
              .digest('hex'),
            conditions: [
              ['context', 'is', intentDatas.contexts[0]],
              ['intent', 'is', intentDatas.name]
            ],
            utterance: s,
            context: intentDatas.contexts[0]
          } as Test
        })
      )
    }
    await state.ghost.upsertFile('./intents', file, JSON.stringify(intentDatas, undefined, 2))
  }
  await state.ghost.upsertFile('./', 'nlu-tests.json', JSON.stringify(tests, undefined, 2))
}
export async function getTrainTestDatas(state: BotState) {
  if (
    (await state.ghost.fileExists('./datas/plop', 'test_set.json')) &&
    (await state.ghost.fileExists('./datas/plop', 'train_set.json'))
  ) {
    console.log('DATA From cache !')
    const vectorized_train: Data[] = await state.ghost.readFileAsObject<Data[]>('./datas/plop', 'train_set.json')
    const vectorized_test: Data[] = await state.ghost.readFileAsObject<Data[]>('./datas/plop', 'test_set.json')
    state.trainDatas = vectorized_train
    state.testDatas = vectorized_test
    console.log(state.trainDatas.length)
    return { train: vectorized_train, test: vectorized_test }
  }
  console.log('Loading')
  const rawTrain: RawData[] = []
  let rawTest: Test[] = []

  const intentsFiles = await state.ghost.directoryListing('./intents', '*.json')
  for (const file of intentsFiles) {
    const jsonData = await state.ghost.readFileAsObject<RawData>('./intents', file)
    rawTrain.push(jsonData)
  }

  const testFileExist = await state.ghost.fileExists('./', 'nlu-tests.json')
  if (testFileExist) {
    rawTest = await state.ghost.readFileAsObject<Test[]>('./', 'nlu-tests.json')
  } else {
    console.log('No test file found : You need a test file to run confusion matrix !')
    console.log('Running a splitter to create 1/4 of training datas to test')
    await splitTrainToTrainAndTest(state)
    rawTest = await state.ghost.readFileAsObject<Test[]>('./', 'nlu-tests.json')
  }

  const intents = _.uniqBy(rawTrain, 'name').map(o => o.name)
  const number2intents: any = { ...intents }
  const intent2number = _.zipObject(Object.values(number2intents), Object.keys(number2intents))

  const vectorized_test: Data[] = []
  const vectorized_train: Data[] = []

  for (const entry of rawTest) {
    const utt_emb = (await state.engine.embed([entry.utterance]))[0]
    vectorized_test.push({
      utt: entry.utterance,
      utt_emb,
      label: parseInt(intent2number[entry.conditions[1][2]]),
      intent: entry.conditions[1][2]
    } as Data)
  }

  const config = await state.ghost.readFileAsString('./', 'bot.config.json')
  const lang = JSON.parse(config).languages[0]
  console.log('LANG', JSON.parse(config).id, lang)
  for (const entry of rawTrain) {
    // console.log(entry.utterances)
    // console.log(entry.utterances[lang])
    for (const utt of entry.utterances[lang]) {
      const utt_emb = (await state.engine.embed([utt]))[0]
      vectorized_train.push({
        utt,
        utt_emb,
        label: parseInt(intent2number[entry.name]),
        intent: entry.name
      } as Data)
    }
  }
  console.log('going to write')
  await state.ghost.upsertFile('./datas/plop', 'test_set.json', JSON.stringify(vectorized_test, undefined, 2))
  console.log('written test')
  await state.ghost.upsertFile('./datas/plop', 'train_set.json', JSON.stringify(vectorized_train, undefined, 2))
  console.log('written train')
  state.trainDatas = vectorized_train
  state.testDatas = vectorized_test
  console.log(state.trainDatas.length)
  return { train: vectorized_train, test: vectorized_test }
}
