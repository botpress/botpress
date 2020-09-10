import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { BotState, Data, RawData, Test } from '../backend/typings'

export async function getTrainTestDatas(state: BotState, logger: sdk.Logger, engine) {
  const EMBEDDING_FOLDER = './embeddings'
  let vectorized_train: Data[] = []
  let vectorized_test: Data[] = []

  if (await state.ghost.fileExists(EMBEDDING_FOLDER, 'train_set.json')) {
    vectorized_train = await state.ghost.readFileAsObject<Data[]>(EMBEDDING_FOLDER, 'train_set.json')
  } else {
    const rawTrain: RawData[] = []
    const intentsFiles = await state.ghost.directoryListing('./flows', '*.intents.json')
    for (const file of intentsFiles) {
      const jsonData = await state.ghost.readFileAsObject<RawData>('./flows', file)
      rawTrain.push(jsonData)
    }

    const vectorized_train: Data[] = []
    const config = await state.ghost.readFileAsString('./', 'bot.config.json')
    const lang = JSON.parse(config).languages[0]

    for (const entry of rawTrain) {
      for (const utt of entry.utterances[lang]) {
        const utt_emb = (await engine.embed([utt.trim()], state.language))[0]
        vectorized_train.push({
          utt,
          utt_emb,
          intent: entry.name
        } as Data)
      }
    }
    await state.ghost.upsertFile(EMBEDDING_FOLDER, 'train_set.json', JSON.stringify(vectorized_train, undefined, 2))
  }

  if (await state.ghost.fileExists(EMBEDDING_FOLDER, 'test_set.json')) {
    vectorized_test = await state.ghost.readFileAsObject<Data[]>(EMBEDDING_FOLDER, 'test_set.json')
  } else {
    let rawTest: Test[] = []
    const testFileExist = await state.ghost.fileExists('./', 'nlu-tests.json')
    if (testFileExist) {
      rawTest = await state.ghost.readFileAsObject<Test[]>('./', 'nlu-tests.json')
    } else {
      logger.info('No test file found : You need a test file to view all')
    }
    const vectorized_test: Data[] = []

    for (const entry of rawTest) {
      const context = _.get(
        entry.conditions.find(elt => elt[0] === 'context'),
        ['2']
      )
      const intent = _.get(
        entry.conditions.find(elt => elt[0] === 'intent'),
        ['2']
      )

      const utt_emb = (await engine.embed([entry.utterance.trim()], state.language))[0]

      vectorized_test.push({
        utt: entry.utterance,
        utt_emb,
        intent: intent,
        ctx: context
      } as Data)
    }
    if (vectorized_test.length) {
      await state.ghost.upsertFile(EMBEDDING_FOLDER, 'test_set.json', JSON.stringify(vectorized_test, undefined, 2))
    }
  }

  return { train: vectorized_train, test: vectorized_test }
}
