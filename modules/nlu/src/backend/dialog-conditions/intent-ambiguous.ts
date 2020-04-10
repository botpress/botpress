import { Condition, IO } from 'botpress/sdk'
import _ from 'lodash'

const AMBIGUITY_GAP = 0.15

export default {
  id: 'intent-is-ambiguous',
  label: 'Intent is ambiguous within topic',
  description: `The users's intention is can be interpreted as multiple intents within the same topic`,
  displayOrder: 1,
  evaluate: (event: IO.IncomingEvent) => {
    const currentTopic = _.get(event.state.session, 'nduContext.last_topic')
    const [highestTopic, topicPreds] =
      _.chain(event?.nlu?.predictions ?? {})
        .toPairs()
        .orderBy(x => x[1].confidence, 'desc')
        .filter(x => x[0] !== 'oos')
        .first()
        .value() || []

    if (currentTopic && highestTopic && currentTopic !== highestTopic) {
      return 0
    }

    const higestIntents = topicPreds.intents
      .filter(i => i.label !== 'none')
      .map(x => x.confidence)
      .slice(0, 3)
    if (higestIntents.length === 0 || higestIntents.length === 1) {
      // no confusion with a single or no intent(s)
      return 0
    }

    const gap = Math.max(...higestIntents) - Math.min(...higestIntents)
    if (gap > AMBIGUITY_GAP) {
      return 0
    }

    return 1 - gap / AMBIGUITY_GAP
  }
} as Condition
