import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { allInRange, GetZPercent, std } from '../tools/math'

import { NONE_INTENT, PredictOutput } from './typings'

const OOS_AS_NONE_TRESH = 0.4
const LOW_INTENT_CONFIDENCE_TRESH = 0.4

// @deprecated > 13
export default function legacyElectionPipeline(input: sdk.IO.EventUnderstanding) {
  if (!input.predictions) {
    return input
  }
  let step: PredictOutput = input as PredictOutput
  step = electIntent(step)
  step = detectAmbiguity(step)
  step = extractElectedIntentSlot(step)
  return step
}

function electIntent(input: PredictOutput): PredictOutput {
  const allCtx = Object.keys(input.predictions)

  const ctx_predictions = allCtx.map(label => {
    const { confidence } = input.predictions[label]
    return { label, confidence }
  })

  const perCtxIntentPrediction = _.mapValues(input.predictions, p => p.intents)

  const oos_predictions = _.mapValues(input.predictions, p => p.oos)

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
          if (oos_predictions[ctx] >= OOS_AS_NONE_TRESH) {
            return [
              ...preds,
              {
                label: NONE_INTENT,
                confidence: oos_predictions[ctx],
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
        .value() as (sdk.MLToolkit.SVM.Prediction & { context: string })[]

      const noneIntent = { label: NONE_INTENT, context: ctx, confidence: 1 }
      if (!intentPreds.length) {
        return [noneIntent]
      } else if (intentPreds[0].confidence === 1 || intentPreds.length === 1) {
        return [{ label: intentPreds[0].label, l0Confidence: ctxConf, context: ctx, confidence: 1 }]
      }
      // else, there is at least two intentPreds

      if (predictionsReallyConfused(intentPreds)) {
        intentPreds.unshift(noneIntent)
      }

      const lnstd = std(intentPreds.filter(x => x.confidence !== 0).map(x => Math.log(x.confidence))) // because we want a lognormal distribution
      let p1Conf = GetZPercent((Math.log(intentPreds[0].confidence) - Math.log(intentPreds[1].confidence)) / lnstd)
      if (isNaN(p1Conf)) {
        p1Conf = 0.5
      }

      return [
        { label: intentPreds[0].label, l0Confidence: ctxConf, context: ctx, confidence: _.round(ctxConf * p1Conf, 3) },
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
    oos_predictions[ctx] > OOS_AS_NONE_TRESH
  if (!predictions.length || shouldConsiderOOS) {
    predictions = _.orderBy(
      [
        ...predictions.filter(p => p.name !== NONE_INTENT),
        { name: NONE_INTENT, context: ctx, confidence: oos_predictions[ctx] || 1 }
      ],
      'confidence'
    )
  }

  const elected = _.maxBy(predictions, 'confidence')
  return {
    ...input,
    intent: elected,
    intents: predictions
  }
}

function detectAmbiguity(input: PredictOutput): PredictOutput {
  // +- 10% away from perfect median leads to ambiguity
  const preds = input.intents!
  const perfectConfusion = 1 / preds.length
  const low = perfectConfusion - 0.1
  const up = perfectConfusion + 0.1
  const confidenceVec = preds.map(p => p.confidence)

  const ambiguous =
    preds.length > 1 &&
    (allInRange(confidenceVec, low, up) ||
      (preds[0].name === NONE_INTENT && allInRange(confidenceVec.slice(1), low, up)))

  return { ...input, ambiguous }
}

function extractElectedIntentSlot(input: PredictOutput): PredictOutput {
  const intentWasElectedWithoutAmbiguity = input?.intent?.name && !_.isEmpty(input.predictions) && !input.ambiguous
  const intentIsNone = input?.intent?.name === NONE_INTENT
  if (!intentWasElectedWithoutAmbiguity || intentIsNone) {
    return input
  }

  const elected = input.intent!
  const electedIntent = input.predictions[elected.context].intents.find(i => i.label === elected.name)
  return { ...input, slots: electedIntent!.slots }
}

// taken from svm classifier #295
// this means that the 3 best predictions are really close, do not change magic numbers
function predictionsReallyConfused(predictions: sdk.MLToolkit.SVM.Prediction[]): boolean {
  if (predictions.length <= 2) {
    return false
  }

  const stdev = std(predictions.map(p => p.confidence))
  const diff = (predictions[0].confidence - predictions[1].confidence) / stdev
  if (diff >= 2.5) {
    return false
  }

  const bestOf3STD = std(predictions.slice(0, 3).map(p => p.confidence))
  return bestOf3STD <= 0.03
}
