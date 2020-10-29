import { IO } from 'botpress/sdk'
import _ from 'lodash'

/**
 * TODO: move this inside the actual NLU code
 * and find the best possible decision function to merge both none intent and oos.
 */
export default function removeNoneIntent(nlu: IO.EventUnderstanding) {
  const predictions = _.mapValues(nlu.predictions, t => {
    const topic = { ...t }
    const noneIdx = topic.intents.findIndex(i => i.label === 'none')
    if (noneIdx < 0) {
      return topic
    }
    const none = topic.intents[noneIdx]
    topic.intents.splice(noneIdx, 1)
    topic.oos = Math.max(none.confidence, topic.oos)
    return topic
  })

  return { ...nlu, predictions }
}
