import * as sdk from 'botpress/sdk'
import _ from 'lodash'

const NONE_INTENT = 'none'

function detectAmbiguity(intents: sdk.NLU.Intent[]): boolean {
  // +- 10% away from perfect median leads to ambiguity
  const preds = intents
  const perfectConfusion = 1 / preds.length
  const low = perfectConfusion - 0.1
  const up = perfectConfusion + 0.1
  const confidenceVec = preds.map(p => p.confidence)

  const allInRange = (vec: number[], lower: number, upper: number) =>
    vec.map(v => _.inRange(v, lower, upper)).every(_.identity)

  const ambiguous =
    preds.length > 1 &&
    (allInRange(confidenceVec, low, up) ||
      (preds[0].name === NONE_INTENT && allInRange(confidenceVec.slice(1), low, up)))

  return ambiguous
}

/**
 * @description confidence of none intent becomes Math.max(none, oos)
 * @param oos confidence of OOS
 */
const replaceNone = (oos: number) => (i: sdk.NLU.Intent): sdk.NLU.Intent => {
  if (i.name !== NONE_INTENT) {
    return i
  }
  return { ...i, confidence: Math.max(i.confidence, oos) }
}

const toNLUIntent = (context: string) => (intent: sdk.NLU.ContextPrediction['intents'][number]): sdk.NLU.Intent => {
  return {
    name: intent.label,
    confidence: intent.confidence,
    context
  }
}

/**
 * @description make probabilities sum up to 1 (because, oos classifier is different from intent classifier, probabilities don't sum up to 1)
 * @param oos confidence of OOS
 */
const makeTotalConfidenceOne = (intents: sdk.NLU.Intent[]): sdk.NLU.Intent[] => {
  const totalConfidence = intents.reduce(
    (totalConfidence: number, currentIntent: sdk.NLU.Intent) => totalConfidence + currentIntent.confidence,
    0
  )
  return intents.map(i => ({ ...i, confidence: i.confidence / totalConfidence }))
}

export default function simpleElection(nlu: sdk.IO.EventUnderstanding): sdk.IO.EventUnderstanding {
  const { predictions, includedContexts } = nlu
  if (!includedContexts.length || !predictions) {
    return nlu
  }

  const ctxPredictions = _(predictions)
    .toPairs()
    .filter(([ctx, pred]) => includedContexts.includes(ctx))
    .value()

  if (!ctxPredictions.length) {
    const noneIntent: sdk.NLU.Intent = { name: NONE_INTENT, confidence: 1, context: includedContexts[0] }
    return {
      ...nlu,
      intent: noneIntent,
      intents: [noneIntent],
      slots: {},
      ambiguous: false
    }
  }

  const [electedContext, contextPrediction] = _.maxBy(ctxPredictions, ([ctx, pred]) => pred.confidence)

  const topTwoIntents = _(contextPrediction.intents)
    .map(toNLUIntent(electedContext))
    .map(replaceNone(contextPrediction.oos))
    .orderBy(i => i.confidence, 'desc')
    .take(2)
    .value()
  const ambiguous = detectAmbiguity(topTwoIntents)

  const intents = makeTotalConfidenceOne(topTwoIntents)
  const [electedIntent] = intents
  const slots = predictions[electedContext].intents.find(i => i.label === electedIntent.name).slots

  return {
    ...nlu,
    intent: electedIntent,
    intents,
    slots,
    ambiguous
  }
}
