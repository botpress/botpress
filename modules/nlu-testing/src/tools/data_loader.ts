import axios from 'axios'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { BotState, Data, Test } from '../backend/typings'
const EMBEDDING_FOLDER = './embeddings'

const createTrainEmbeddingsFile = async (state: BotState, bp: typeof sdk) => {
  const { data } = await axios.get('/nlu/intents', state.axiosConfig)
  const intents: sdk.NLU.IntentDefinition[] = data

  const config = await state.ghost.readFileAsString('./', 'bot.config.json')
  // TODO Deal with multiple languages for now we only take default one
  const lang = JSON.parse(config).languages[0]

  let vectorized_train: Data[] = []
  for (const entry of intents) {
    const utterances = entry.utterances[lang]
    const allUtts = utterances.map(u => u.trim())
    const allUttsEmb = await bp.NLU.Engine.embed(allUtts, state.language)

    vectorized_train = vectorized_train.concat(
      allUttsEmb.map((e, i) => {
        return { utt: utterances[i], utt_emb: e, intent: entry.name } as Data
      })
    )
  }

  await state.ghost.upsertFile(EMBEDDING_FOLDER, 'train_set.json', JSON.stringify(vectorized_train, undefined, 2))

  return vectorized_train
}

const createTestEmbeddingsFile = async (state: BotState, bp: typeof sdk) => {
  const vectorized_test: Data[] = []
  let rawTest: Test[] = []
  const testFileExist = await state.ghost.fileExists('./', 'nlu-tests.json')

  if (testFileExist) {
    rawTest = await state.ghost.readFileAsObject<Test[]>('./', 'nlu-tests.json')
  } else {
    bp.logger.info('No test file found : You need a test file to view all')
  }

  const allUttsEmb = await bp.NLU.Engine.embed(
    rawTest.map(e => e.utterance),
    state.language
  )

  for (let i = 0; i < rawTest.length; i++) {
    const context = rawTest[i].conditions.find(elt => elt[0] === 'context')?.[2]
    const intent = rawTest[i].conditions.find(elt => elt[0] === 'intent')?.[2]

    vectorized_test.push({
      utt: rawTest[i].utterance,
      utt_emb: allUttsEmb[i],
      ctx: context,
      intent
    } as Data)
  }

  if (vectorized_test.length) {
    await state.ghost.upsertFile(EMBEDDING_FOLDER, 'test_set.json', JSON.stringify(vectorized_test, undefined, 2))
  }

  return vectorized_test
}

export async function getTrainTestDatas(state: BotState, bp: typeof sdk) {
  const EMBEDDING_FOLDER = './embeddings'

  const embedTrainFileExists = await state.ghost.fileExists(EMBEDDING_FOLDER, 'train_set.json')
  const embedTestFileExists = await state.ghost.fileExists(EMBEDDING_FOLDER, 'test_set.json')

  const vectorized_train = embedTrainFileExists
    ? await state.ghost.readFileAsObject<Data[]>(EMBEDDING_FOLDER, 'train_set.json')
    : await createTrainEmbeddingsFile(state, bp)

  const vectorized_test = embedTestFileExists
    ? await state.ghost.readFileAsObject<Data[]>(EMBEDDING_FOLDER, 'test_set.json')
    : await createTestEmbeddingsFile(state, bp)

  return { train: vectorized_train, test: vectorized_test }
}
