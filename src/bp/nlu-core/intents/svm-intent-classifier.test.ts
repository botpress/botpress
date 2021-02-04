import { Tools } from 'nlu-core/typings'
import { makeTestUtterance } from 'nlu-core/utterance/utterance'

import { SvmIntentClassifier } from './svm-intent-classifier'

const tools = (<Partial<Tools>>{}) as Tools

test('predict with no ctx classifier and no ctxs returns empty array', async () => {
  // arrange
  const rootIntentClassifier = new SvmIntentClassifier(tools, () => [])
  rootIntentClassifier.load(JSON.stringify({ svmModel: undefined, intentNames: [] }))

  // act
  const { intents } = await rootIntentClassifier.predict(
    makeTestUtterance("hello, I love you won't you tell me your name")
  )

  // assert
  expect(intents.length).toEqual(0)
})

test('predict with no ctx classifier returns equi-confident ctx with none intent in each', async () => {
  // arrange
  const rootIntentClassifier = new SvmIntentClassifier(tools, () => [])
  const intentNames = ['A', 'B', 'C', 'D']
  rootIntentClassifier.load(JSON.stringify({ svmModel: undefined, intentNames }))

  // act
  const { intents } = await rootIntentClassifier.predict(
    makeTestUtterance("hello, I love you won't you tell me your name")
  )

  // assert
  const labels = intents.map(ctx => ctx.name)
  const confs = intents.map(ctx => ctx.confidence)
  expect(labels).toEqual(intentNames)
  expect(confs).toEqual([0.25, 0.25, 0.25, 0.25])
})
