import { predictContext, predictIntent, Predictors } from './predict-pipeline'
import Utterance from './utterance/utterance'

describe('predict pipeline', () => {
  test('predict with no ctx classifier and no ctxs returns empty array', async () => {
    // arrange
    const languageCode = 'en'
    const contexts: string[] = []

    // act
    const { ctx_predictions } = await predictContext(
      {
        rawText: "hello, I love you won't you tell me your name",
        languageCode,
        utterance: new Utterance([], [], [], languageCode),
        oos_predictions: {}
      },
      <Predictors>{ contexts, ctx_classifier: undefined }
    )

    // assert
    expect(ctx_predictions.length).toEqual(0)
  })

  test('predict with no ctx classifier returns equi-confident ctx with none intent in each', async () => {
    // arrange
    const languageCode = 'en'
    const contexts = ['A', 'B', 'C', 'D']

    // act
    const { ctx_predictions } = await predictContext(
      {
        rawText: "hello, I love you won't you tell me your name",
        languageCode,
        utterance: new Utterance([], [], [], languageCode),
        oos_predictions: {}
      },
      <Predictors>{ contexts, ctx_classifier: undefined }
    )

    // assert
    const labels = ctx_predictions.map(ctx => ctx.label)
    const confs = ctx_predictions.map(ctx => ctx.confidence)
    expect(labels).toEqual(contexts)
    expect(confs).toEqual([0.25, 0.25, 0.25, 0.25])
  })

  test('predict with no intent classifier returns only none intent for each ctx', async () => {
    // arrange
    const languageCode = 'en'
    const contexts = ['A', 'B', 'C', 'D']

    // act
    const step = await predictContext(
      {
        rawText: "hello, I love you won't you tell me your name",
        languageCode,
        utterance: new Utterance([], [], [], languageCode),
        oos_predictions: {}
      },
      <Predictors>{ contexts, ctx_classifier: undefined }
    )
    const { intent_predictions } = await predictIntent(step, <Predictors>{
      contexts,
      ctx_classifier: undefined,
      intent_classifier_per_ctx: {}
    })

    // assert
    const ctxs = Object.keys(intent_predictions)
    const intents = Object.values(intent_predictions)
    expect(ctxs).toEqual(contexts)
    for (const i of intents) {
      expect(i).toEqual([{ label: 'none', confidence: 1 }])
    }
  })
})
