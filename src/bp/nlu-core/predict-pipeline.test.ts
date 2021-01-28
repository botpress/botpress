import { RootIntentClassifier } from './intents/root-intent-classifier'
import { predictContext, predictIntent, Predictors } from './predict-pipeline'
import { Tools } from './typings'
import Utterance from './utterance/utterance'

describe('predict pipeline', () => {
  test('predict with no intent classifier returns only none intent for each ctx', async () => {
    // arrange
    const languageCode = 'en'
    const contexts = ['A', 'B', 'C', 'D']

    const rootIntentClassifier = new RootIntentClassifier({} as Tools)
    rootIntentClassifier.load(JSON.stringify({ svmModel: undefined, intentNames: contexts }))

    // act
    const step = await predictContext(
      {
        rawText: "hello, I love you won't you tell me your name",
        languageCode,
        utterance: new Utterance([], [], [], languageCode)
      },
      <Predictors>{ contexts, ctx_classifier: rootIntentClassifier }
    )

    const { intent_predictions } = await predictIntent(step, <Predictors>{
      contexts,
      intent_classifier_per_ctx: {},
      ctx_classifier: rootIntentClassifier
    })

    // assert
    const ctxs = Object.keys(intent_predictions)
    const intents = Object.values(intent_predictions)
    expect(ctxs).toEqual(contexts)
    for (const i of intents) {
      expect(i).toEqual({ oos: 1, intents: [{ name: 'none', confidence: 1 }] })
    }
  })
})
