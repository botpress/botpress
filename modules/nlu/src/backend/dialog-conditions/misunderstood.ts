import { Condition } from 'botpress/sdk'
import _ from 'lodash'

export default {
  id: 'user_intent_misunderstood',
  label: 'Users says something misunderstood (intent)',
  description: `The user's intention is misunderstood`,
  displayOrder: 3,
  params: {
    maxConfidence: {
      label: 'Maximum reachable confidence (%)',
      type: 'number',
      defaultValue: 100,
      required: true
    }
  },
  evaluate: (event, params) => {
    const oos = _.get(event, `nlu.predictions.oos.confidence`, 0)
    const highestCtx = _.chain(event?.nlu?.predictions ?? {})
      .toPairs()
      .orderBy(x => x[1].confidence, 'desc')
      .map(x => x[0])
      .filter(x => x !== 'oos')
      .first()
      .value()

    const highest_none = _.chain(event)
      .get(`nlu.predictions.${highestCtx}.intents`, [])
      .find(x => x.label === 'none')
      .get('confidence', 0)
      .value()

    const max = Math.max(highest_none, oos)
    return params.maxConfidence ? max * (params.maxConfidence / 100) : max
  }
} as Condition
