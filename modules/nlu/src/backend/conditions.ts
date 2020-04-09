import * as sdk from 'botpress/sdk'
import _ from 'lodash'

export const dialogConditions: sdk.Condition[] = [
  {
    id: 'user_intent_is',
    label: 'User asks something (intent)',
    description: `The user's intention is {intentName}`,
    callback: '/mod/nlu/condition/intentChanged',
    displayOrder: 0,
    params: {
      intentName: { label: 'Name of intent', type: 'string' }
    },
    editor: {
      module: 'nlu',
      component: 'LiteEditor'
    },
    evaluate: (event, { intentName, topicName }) => {
      const oosConfidence = _.get(event, `nlu.predictions.oos.confidence`, 0)
      const topicConf = _.get(event, `nlu.predictions.${topicName}.confidence`, 0)
      const topicIntents = _.get(event, `nlu.predictions.${topicName}.intents`, [])
      const intentConf = _.get(
        topicIntents.find(x => x.label === intentName),
        'confidence',
        0
      )
      return topicConf * intentConf * (1 - oosConfidence)
    }
  },
  {
    id: 'user_intent_misunderstood',
    label: 'Users says something misunderstood (intent)',
    description: `The user's intention is misunderstood`,
    displayOrder: 1,
    evaluate: event => {
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

      return Math.max(highest_none, oos)
    }
  }
]
