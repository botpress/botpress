import { Condition } from 'botpress/sdk'
import _ from 'lodash'

export default {
  id: 'user_intent_is',
  label: 'module.nlu.conditions.userWantsTo',
  description: `The user's intention is {intentName}`,
  callback: '/mod/nlu/condition/intentChanged',
  displayOrder: 0,
  fields: [
    // Tagging for slots will come in a future PR
    {
      key: 'intentName',
      type: 'overridable',
      overrideKey: 'intent',
      label: 'intent'
    }
  ],
  evaluate: (event, { intentName, topicName }) => {
    const topicConf = _.get(event, `nlu.predictions.${topicName}.confidence`, 0)
    const oosConfidence = _.get(event, `nlu.predictions.${topicName}.oos`, 0)
    const topicIntents = _.get(event, `nlu.predictions.${topicName}.intents`, [])
    const intentConf = _.get(
      topicIntents.find(x => x.label === intentName),
      'confidence',
      0
    )
    return topicConf * intentConf * (1 - oosConfidence)
  },
  onEnter: ({ intentName, topicName }) => [`nlu/elect-intent {"topic":"$thisTopic","intent":"book-flight"}`]
} as Condition
