import { Condition, IO } from 'botpress/sdk'
import _ from 'lodash'

const AMBIGUITY_GAP = 0.15

export default {
  id: 'topic-is-ambiguous',
  label: 'Detected topics are ambiguous',
  description: 'What user said might refer to multiple topics ',
  displayOrder: 2,
  evaluate: (event: IO.IncomingEvent) => {
    const highestTopics: number[] = _.chain(event?.nlu?.predictions ?? {})
      .toPairs()
      .filter(x => x[0] !== 'oos')
      .orderBy(x => x[1].confidence, 'desc')
      .map('1.confidence')
      .take(3)
      .value()

    if (highestTopics.length <= 1) {
      // no confusion with a single or no topic)
      return 0
    }

    const gap = Math.max(...highestTopics) - Math.min(...highestTopics)
    if (gap > AMBIGUITY_GAP) {
      return 0
    }

    return 1 - gap / AMBIGUITY_GAP
  }
} as Condition
