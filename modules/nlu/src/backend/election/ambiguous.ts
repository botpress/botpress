import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import { allInRange } from '../tools/math'
import { NONE_INTENT } from './typings'

export function detectAmbiguity(input: sdk.IO.EventUnderstanding): sdk.IO.EventUnderstanding {
  // +- 10% away from perfect median leads to ambiguity
  const totalConfInTopN = _.sumBy(input.intents, i => i.confidence)
  const preds = input.intents.map(i => ({ ...i, confidence: i.confidence / totalConfInTopN }))
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
