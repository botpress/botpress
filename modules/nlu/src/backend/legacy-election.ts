import * as sdk from 'botpress/sdk'
import * as math from './tools/math'
import _ from 'lodash'

const OOS_AS_NONE_TRESH = 0.3
const LOW_INTENT_CONFIDENCE_TRESH = 0.4
const NONE_INTENT = 'none' // should extract constant in comon place

type EventUnderstanding = sdk.IO.EventUnderstanding

export default async function elect(predictionOutput: EventUnderstanding): Promise<EventUnderstanding> {
  let nlu = predictionOutput
  nlu = electIntent(nlu)
  nlu = detectAmbiguity(nlu)
  nlu = await extractElectedIntentSlots(nlu)
  return nlu
}

function electIntent(input: EventUnderstanding): EventUnderstanding {
  const allCtx = Object.keys(input.predictions)

  const ctx_predictions = allCtx.map(label => {
    const { confidence } = input.predictions[label]
    return { label, confidence }
  })

  const oss_label = 'oos'
  const oos_predictions = {
    label: oss_label,
    confidence: input.predictions[oss_label].confidence
  }

  const perCtxIntentPrediction = _.chain(input.predictions)
    .mapValues(v => v.intents)
    .value()

  const totalConfidence = Math.min(
    1,
    _.sumBy(
      ctx_predictions.filter(x => input.includedContexts.includes(x.label)),
      'confidence'
    )
  )
  const ctxPreds = ctx_predictions.map(x => ({ ...x, confidence: x.confidence / totalConfidence }))

  // taken from svm classifier #349
  let predictions = _.chain(ctxPreds)
    .flatMap(({ label: ctx, confidence: ctxConf }) => {
      const intentPreds = _.chain(perCtxIntentPrediction[ctx] || [])
        .thru(preds => {
          if (oos_predictions?.confidence > OOS_AS_NONE_TRESH) {
            return [
              ...preds,
              {
                label: NONE_INTENT,
                confidence: oos_predictions?.confidence ?? 1,
                context: ctx,
                l0Confidence: ctxConf
              }
            ]
          } else {
            return preds
          }
        })
        .map(p => ({ ...p, confidence: _.round(p.confidence, 2) }))
        .orderBy('confidence', 'desc')
        .value()

      if (intentPreds[0].confidence === 1 || intentPreds.length === 1) {
        return [{ label: intentPreds[0].label, l0Confidence: ctxConf, context: ctx, confidence: 1 }]
      }

      if (predictionsReallyConfused(intentPreds)) {
        intentPreds.unshift({ label: NONE_INTENT, context: ctx, confidence: 1, slots: {} })
      }

      const lnstd = math.std(intentPreds.filter(x => x.confidence !== 0).map(x => Math.log(x.confidence))) // because we want a lognormal distribution
      let p1Conf = math.GetZPercent((Math.log(intentPreds[0].confidence) - Math.log(intentPreds[1].confidence)) / lnstd)
      if (isNaN(p1Conf)) {
        p1Conf = 0.5
      }

      return [
        {
          label: intentPreds[0].label,
          l0Confidence: ctxConf,
          context: ctx,
          confidence: _.round(ctxConf * p1Conf, 3)
        },
        {
          label: intentPreds[1].label,
          l0Confidence: ctxConf,
          context: ctx,
          confidence: _.round(ctxConf * (1 - p1Conf), 3)
        }
      ]
    })
    .orderBy('confidence', 'desc')
    .filter(p => input.includedContexts.includes(p.context))
    .uniqBy(p => p.label)
    .map(p => ({ name: p.label, context: p.context, confidence: p.confidence }))
    .value()

  const ctx = _.get(predictions, '0.context', 'global')
  const shouldConsiderOOS =
    predictions.length &&
    predictions[0].name !== NONE_INTENT &&
    predictions[0].confidence < LOW_INTENT_CONFIDENCE_TRESH &&
    oos_predictions?.confidence > OOS_AS_NONE_TRESH
  if (!predictions.length || shouldConsiderOOS) {
    predictions = _.orderBy(
      [
        ...predictions.filter(p => p.name !== NONE_INTENT),
        { name: NONE_INTENT, context: ctx, confidence: oos_predictions?.confidence ?? 1 }
      ],
      'confidence'
    )
  }

  const elected = _.maxBy(predictions, 'confidence')
  return {
    ...input,
    intents: predictions,
    intent: elected
  }
}

function detectAmbiguity(input: EventUnderstanding): EventUnderstanding {
  // +- 10% away from perfect median leads to ambiguity
  const preds = input.intents
  const perfectConfusion = 1 / preds.length
  const low = perfectConfusion - 0.1
  const up = perfectConfusion + 0.1
  const confidenceVec = preds.map(p => p.confidence)

  const ambiguous =
    preds.length > 1 &&
    (math.allInRange(confidenceVec, low, up) ||
      (preds[0].name === NONE_INTENT && math.allInRange(confidenceVec.slice(1), low, up)))

  return { ...input, ambiguous }
}

async function extractElectedIntentSlots(input: EventUnderstanding): Promise<EventUnderstanding> {
  const intentWasElectedWithoutAmbiguity = input?.intent?.name && !_.isEmpty(input.predictions) && !input.ambiguous
  if (!intentWasElectedWithoutAmbiguity) {
    return input
  }

  const electedIntent = input.predictions[input.intent.context].intents.find(i => i.label === input.intent.name)
  return { ...input, slots: electedIntent.slots }
}

// taken from svm classifier #295
// this means that the 3 best predictions are really close, do not change magic numbers
function predictionsReallyConfused(predictions: sdk.MLToolkit.SVM.Prediction[]): boolean {
  if (predictions.length <= 2) {
    return false
  }

  const std = math.std(predictions.map(p => p.confidence))
  const diff = (predictions[0].confidence - predictions[1].confidence) / std
  if (diff >= 2.5) {
    return false
  }

  const bestOf3STD = math.std(predictions.slice(0, 3).map(p => p.confidence))
  return bestOf3STD <= 0.03
}
