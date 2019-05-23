import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { escapeRegex } from '../../tools/patterns-utils'

export const NoneIntent: sdk.NLU.Intent = {
  confidence: 1.0,
  name: 'none',
  context: 'global'
}

/**
 * Finds the most confident intent, either by the intent being above a fixed threshold, or else if an intent is more than {@param zThresh} standard deviation (outlier method) from the mean.
 * NOTE: If you ever need this in another context, we could move this into tools and replace the "intent" concept for a more generic "prediction"
 * @param intents
 * @param fixedThreshold
 * @param zThresh number of standard deviation between 2 furthest from the mean
 */
export function findMostConfidentIntentMeanStd(
  intents: sdk.NLU.Intent[],
  fixedThreshold: number,
  zThresh: number = 1.15
): sdk.NLU.Intent {
  if (!intents.length) {
    return NoneIntent
  }

  const best = _.orderBy(intents, ['confidence'], 'desc').find(x => x.confidence >= fixedThreshold)

  if (best) {
    return best
  }

  if (intents.length < 3) {
    return NoneIntent
  }

  const mean = _.meanBy<sdk.NLU.Intent>(intents, 'confidence')
  const stdDeviation = Math.sqrt(
    intents.reduce((a, c) => a + Math.pow(c.confidence - mean, 2), 0) / (intents.length - 1)
  )
  const zintents = intents
    .map(intent => ({ intent, z: _.round((intent.confidence - mean) / stdDeviation, 2) }))
    .sort((a, b) => (a.z > b.z ? -1 : 1))

  return zintents[0].z - zintents[1].z >= zThresh ? zintents[0].intent : NoneIntent
}

export const createIntentMatcher = (intentName: string): ((pattern: string) => boolean) => {
  return (pattern: string) => {
    const matcher = new RegExp(`^${escapeRegex(pattern)}$`, 'i')
    return matcher.test(intentName)
  }
}
