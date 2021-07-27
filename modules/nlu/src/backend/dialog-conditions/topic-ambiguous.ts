import { Condition, IO } from 'botpress/sdk'
import _ from 'lodash'

interface Params {
  ambiguityThreshold: number
}

export default {
  id: 'topic_is_ambiguous',
  label: 'Detected topics are ambiguous',
  description: 'What user said might refer to multiple topics ',
  displayOrder: 2,
  params: {
    ambiguityThreshold: { label: 'Ambiguity threshold', type: 'number', defaultValue: 0.15 }
  },
  evaluate: (event: IO.IncomingEvent, { ambiguityThreshold }: Params) => {
    const highestTopics: number[] = _.chain(event?.nlu?.predictions ?? {})
      .toPairs()
      .orderBy('1.confidence', 'desc')
      .map('1.confidence')
      .take(2)
      .value()

    if (highestTopics.length <= 1) {
      // no confusion with a single or no topic)
      return 0
    }

    const gap = highestTopics[0] - highestTopics[1]
    if (gap > ambiguityThreshold) {
      return 0
    }

    return 1 - gap / ambiguityThreshold
  }
} as Condition
