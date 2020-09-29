import { Condition } from 'botpress/sdk'
import _ from 'lodash'

export default {
  id: 'user_intent_is',
  label: 'module.nlu.conditions.userWantsTo',
  description: "The user's intention is {intentName}",
  callback: '/mod/nlu/condition/intentChanged', // TODO: change this for a more obvious name
  displayOrder: 0,
  advancedSettings: [
    {
      defaultValue: true,
      key: 'activeWorkflowOnly',
      type: 'checkbox',
      label: 'module.nlu.conditions.fields.label.activeWorkflowOnly'
    }
  ],
  fields: [
    {
      key: 'utterances',
      type: 'text_array',
      superInput: true,
      customPlaceholder: true,
      translated: true,
      variablesOnly: true,
      label: 'module.nlu.intents.label',
      group: {
        addLabel: 'module.nlu.intents.addBtn'
      }
    }
  ],
  evaluate: (event, params) => {
    const { topicName } = params
    const contextName = params.contextName ?? topicName ?? ''
    const intentName = params.intentName ?? `${params.wfName}/${params.nodeName}/${params.conditionIndex}`
    const topicConf = contextName.startsWith('explicit:')
      ? 1
      : _.get(event, `nlu.predictions.${contextName}.confidence`, 0)
    const oosConfidence = _.get(event, `nlu.predictions.${contextName}.oos`, 0)
    const topicIntents = _.get(event, `nlu.predictions.${contextName}.intents`, [])
    const intentConf = _.get(
      topicIntents.find((x: any) => x.label.toLowerCase() === intentName.toLowerCase()),
      'confidence',
      0
    )
    return topicConf * intentConf * (1 - oosConfidence)
  },
  onEnter: () => ['nlu/elect-intent {"topic":"$thisTopic","intent":"book-flight"}']
} as Condition
