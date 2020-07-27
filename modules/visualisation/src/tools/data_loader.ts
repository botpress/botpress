import _ from 'lodash'

import { Data, RawData } from '../backend/typings'
import { VisuState } from '../backend/typings'

export type Test = { id: string; utterance: string; context: string; conditions: [string, string, string][] }

export async function getTrainTestDatas(state: VisuState) {
  if (
    (await state.ghost.fileExists(`./datas/${state.embedder.model_name}`, 'test_set.json')) &&
    (await state.ghost.fileExists(`./datas/${state.embedder.model_name}`, 'train_set.json'))
  ) {
    const vectorized_train: Data[] = await state.ghost.readFileAsObject<Data[]>(
      `./datas/${state.embedder.model_name}`,
      'train_set.json'
    )
    const vectorized_test: Data[] = await state.ghost.readFileAsObject<Data[]>(
      `./datas/${state.embedder.model_name}`,
      'test_set.json'
    )
    state.trainDatas = vectorized_train
    state.testDatas = vectorized_test
    return { train: vectorized_train, test: vectorized_test }
  }
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
  }

  const intents = _.uniqBy(rawTrain, 'name').map(o => o.name)
  const number2intents: any = { ...intents }
  const intent2number = _.zipObject(Object.values(number2intents), Object.keys(number2intents))

  const vectorized_test: Data[] = []
  const vectorized_train: Data[] = []

  for (const entry of rawTest) {
    const utt_emb = await state.embedder.embed(entry.utterance)
    vectorized_test.push({
      utt: entry.utterance,
      utt_emb,
      label: parseInt(intent2number[entry.conditions[0][2]]),
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
      const utt_emb = await state.embedder.embed(utt)
      vectorized_train.push({
        utt,
        utt_emb,
        label: parseInt(intent2number[entry.name]),
        intent: entry.name
      } as Data)
    }
  }
  console.log('going to write')
  await state.ghost.upsertFile(
    `./datas/${state.embedder.model_name}`,
    'test_set.json',
    JSON.stringify(vectorized_test, undefined, 2)
  )
  console.log('written test')
  await state.ghost.upsertFile(
    `./datas/${state.embedder.model_name}`,
    'train_set.json',
    JSON.stringify(vectorized_train, undefined, 2)
  )
  console.log('written train')
  state.trainDatas = vectorized_train
  state.testDatas = vectorized_test
  return { train: vectorized_train, test: vectorized_test }
}
