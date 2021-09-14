import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import { allInRange, scaleConfidences } from './math'
import { NONE_INTENT } from './typings'

export function detectAmbiguity(input: sdk.IO.EventUnderstanding): sdk.IO.EventUnderstanding {
  if (!input.intents) {
    return input
  }

  // +- 10% away from perfect median leads to ambiguity
  const preds = scaleConfidences(input.intents)
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
