import { Condition, NLU } from 'botpress/sdk'

export default {
  id: 'user_intent_is',
  label: 'User asks something (intent)',
  description: "The user's intention is {intentName}",
  callback: 'nlu/condition/intentChanged',
  displayOrder: 0,
  params: {
    intentName: { label: 'Name of intent', type: 'string' }
  },
  useLiteEditor: true,
  evaluate: (event, { intentName, topicName }) => {
    const contextPrediction = event.nlu?.predictions?.[topicName] as NLU.ContextPrediction

    const topicConf = contextPrediction.confidence || 0
    const oosConfidence = contextPrediction.oos || 0
    const topicIntents = contextPrediction.intents || []
    const intentConf = topicIntents.find(x => x.label === intentName)?.confidence || 0

    return topicConf * intentConf * (1 - oosConfidence)
  }
} as Condition
