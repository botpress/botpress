import * as sdk from 'botpress/sdk'
import _ from 'lodash'

export const dialogConditions: sdk.Condition[] = [
  {
    id: 'user_channel_is',
    label: 'module.nlu.conditions.userUsingChannel',
    description: `The user speaks on channel {channelName}`,
    params: {
      fields: [{
        type: 'select',
        key: 'channelName',
        label: 'module.nlu.conditions.fields.label.channel',
        placeholder: 'module.nlu.conditions.fields.placeholder.pickChannel',
        dynamicOptions: {
          endpoint: 'BOT_API_PATH/mod/ndu/channels',
          valueField: 'value',
          labelField: 'label'
        }
      }]
    },
    evaluate: (event, params) => {
      return event.channel === params.channelName ? 1 : 0
    }
  },
  {
    id: 'user_language_is',
    label: 'module.nlu.conditions.userSpeaks',
    description: `The user's language is {language}`,
    params: {
      fields: [{
        type: 'select',
        key: 'language',
        label: 'module.nlu.conditions.fields.label.language',
        placeholder: 'module.nlu.conditions.fields.placeholder.pickLanguage',
        dynamicOptions: {
          endpoint: 'API_PATH/admin/languages',
          path: 'installed',
          valueField: 'lang',
          labelField: 'name'
        }
      }]
    },
    evaluate: (event, params) => {
      return event.state.user.language === params.language ? 1 : 0
    }
  },
  {
    id: 'user_is_authenticated',
    label: 'module.nlu.conditions.userAuthenticated',
    evaluate: event => {
      return event.state.session.isAuthenticated ? 1 : 0
    }
  },
  {
    id: 'user_topic_source',
    label: 'module.nlu.conditions.userComingFromTopic',
    description: `The user's last topic was {topicName}`,
    params: {
      fields: [{
        type: 'select',
        key: 'topicName',
        label: 'module.nlu.conditions.fields.label.topic',
        placeholder: 'module.nlu.conditions.fields.placeholder.pickTopic',
        dynamicOptions: {
          endpoint: 'BOT_API_PATH/topics',
          valueField: 'name',
          labelField: 'name'
        }
      }]
    },
    evaluate: (event, params) => {
      const topics = event.state.session.lastTopics
      return topics && topics[topics.length - 1] === params.topicName ? 1 : 0
    }
  },
  {
    id: 'raw_js',
    label: 'module.nlu.conditions.customCode',
    description: `{label}`,
    params: {
      fields: [
        {
          type: 'textarea',
          key: 'expression',
          label: 'module.nlu.conditions.fields.label.code'
        }
      ]
    },
    evaluate: (event, params) => {
      const code = `
      try {
        return ${params.expression};
      } catch (err) {
        if (err instanceof TypeError) {
          console.log(err)
          return false
        }
        throw err
      }`

      const fn = new Function('event', code)
      return fn(event) ? 1 : 0
    }
  },
  {
    id: 'user_already_spoke',
    label: 'module.nlu.conditions.userAlreadySpoke',
    evaluate: event => {
      const { lastMessages } = event.state.session
      return lastMessages && lastMessages.length > 0 ? 1 : 0
    }
  },
  {
    id: 'outside_flow_node',
    label: 'module.nlu.conditions.userNotInWorkflowOrBlock',
    evaluate: event => {
      return !event.state.context?.currentFlow && !event.state.context?.currentNode ? 1 : 0
    }
  },
  {
    id: 'custom_confidence',
    label: 'module.nlu.conditions.customPriority',
    description: `Confidence level of {confidence}`,
    params: {
      fields: [{ type: 'number', key: 'confidence', label: 'module.nlu.conditions.fields.label.confidence' }]
    },
    evaluate: (_event, params) => {
      return params.confidence
    }
  },
  {
    id: 'always',
    label: 'module.nlu.conditions.alwaysTrue',
    evaluate: () => {
      return 1
    }
  },
  {
    id: 'type_text',
    label: 'module.nlu.conditions.userTyped',
    description: `The user typed {text}`,
    params: {
      fields: [
        {
          key: 'candidate',
          label: 'module.nlu.conditions.fields.label.candidate',
          type: 'text_array',
          group: {
            addLabel: 'studio.flow.condition.addCondition'
          }
        }
      ],
      advancedSettings: [
        {
          key: 'exactMatch',
          label: 'module.nlu.conditions.fields.label.exactMatch',
          type: 'checkbox'
        },
        {
          key: 'caseSensitive',
          label: 'module.nlu.conditions.fields.label.caseSensitive',
          type: 'checkbox'
        }
      ]
    },
    evaluate: (event, params) => {
      const { candidate, exactMatch, caseSensitive } = params

      const preview = caseSensitive ? event.preview : event.preview?.toLowerCase() || ''
      const userText = caseSensitive ? event.payload?.text : event.payload?.text?.toLowerCase() || ''

      const foundMatch = (candidate || []).find(
        word =>
          (!exactMatch && (preview.includes(word) || userText.includes(word))) ||
          (exactMatch && (preview === word || userText === word))
      )

      return foundMatch ? 1 : 0
    }
  },
  {
    id: 'workflow_ended',
    label: 'module.nlu.conditions.userEndedWorkflow',
    params: {
      fields: [
        {
          key: 'outcome',
          label: 'module.nlu.conditions.fields.label.workflowOutcome',
          placeholder: 'module.nlu.conditions.fields.placeholder.pickWorkflowOutcome',
          type: 'select',
          options: [
            { label: 'module.nlu.conditions.fields.label.success', value: 'success' },
            { label: 'module.nlu.conditions.fields.label.failure', value: 'failure' }
          ]
        },
        {
          key: 'ignoredWorkflows',
          label: 'module.nlu.conditions.fields.label.ignoredWorkflows',
          type: 'text_array',
          group: {
            addLabel: 'studio.flow.ignoredWorkflows.addLabel'
          }
        }
      ]
    },
    evaluate: (event, params) => {
      if (event.type !== 'workflow_ended') {
        return 0
      }

      const { workflow, success } = event.payload
      const { ignoredWorkflows, outcome } = params

      if (ignoredWorkflows?.find(wf => wf === workflow)) {
        return 0
      }

      if ((outcome === 'success' && success) || (outcome === 'failure' && !success)) {
        return 1
      }

      return 0
    }
  }
]
