import _ from 'lodash'
import { ContextPrediction } from 'nlu/engine'

import { BpPredictOutput } from './api-mapper'

const _adjustTotalConfidenceTo100 = (context: ContextPrediction): ContextPrediction => {
  const totalConfidence = context.oos + _.sum(context.intents.map(i => i.confidence))
  context.oos = context.oos / totalConfidence
  context.intents = context.intents.map(i => ({ ...i, confidence: i.confidence / totalConfidence }))
  return context
}

/**
 * TODO: move this inside the actual NLU code
 * and find the best possible decision function to merge both none intent and oos.
 */
export default function removeNoneIntent(nlu: BpPredictOutput): BpPredictOutput {
  const contexts = _.mapValues(nlu.contexts, ctx => {
    const context = { ...ctx }
    const noneIdx = context.intents.findIndex(i => i.label === 'none')
    if (noneIdx < 0) {
      return context
    }
    const none = context.intents[noneIdx]
    context.intents.splice(noneIdx, 1)
    context.oos = Math.max(none.confidence, context.oos)

    return _adjustTotalConfidenceTo100(context)
  })

  return { ...nlu, contexts }
}
