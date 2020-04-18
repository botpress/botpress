import { Condition } from 'botpress/sdk'
import _ from 'lodash'

export default {
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
} as Condition
