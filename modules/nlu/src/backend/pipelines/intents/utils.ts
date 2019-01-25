import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { escapeRegex } from '../../tools/patterns-utils'

export const NoneIntent: sdk.NLU.Intent = {
  confidence: 1.0,
  name: 'none',
  context: 'global'
}

/**
 * Finds the most confident intent, either by the intent being above a fixed threshold, or else if an intent is more than {@param std} standard deviation (outlier method).
 * NOTE: If you ever need this in another context, we could move this into tools and replace the "intent" concept for a more generic "prediction"
 * @param intents
 * @param fixedThreshold
 * @param std number of standard deviation away. normally between 2 and 5
 */
export function findMostConfidentIntentMeanStd(
  intents: sdk.NLU.Intent[],
  fixedThreshold: number,
  std: number = 3
): sdk.NLU.Intent {
  if (!intents.length) {
    return NoneIntent
  }

  const best = intents.find(x => x.confidence >= fixedThreshold)

  if (best) {
    return best
  }

  const mean = _.meanBy<sdk.NLU.Intent>(intents, 'confidence')
  const stdErr =
    Math.sqrt(intents.reduce((a, c) => a + Math.pow(c.confidence - mean, 2), 0) / intents.length) /
    Math.sqrt(intents.length)

  const dominant = intents.find(x => x.confidence >= stdErr * std + mean)

  return dominant || NoneIntent
}

export const createIntentMatcher = (intentName: string): ((pattern: string) => boolean) => {
  return (pattern: string) => {
    const matcher = new RegExp(`^${escapeRegex(pattern)}$`, 'i')
    return matcher.test(intentName)
  }
}
