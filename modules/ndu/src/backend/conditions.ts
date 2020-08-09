import * as sdk from 'botpress/sdk'
import _ from 'lodash'

export const dialogConditions: sdk.Condition[] = [
  {
    id: 'user_channel_is',
    label: 'module.ndu.conditions.userUsingChannel',
    description: `The user speaks on channel {channelName}`,
    fields: [
      {
        type: 'select',
        key: 'channelName',
        label: 'channel',
        placeholder: 'module.ndu.conditions.fields.placeholder.pickChannel',
        dynamicOptions: {
          endpoint: 'BOT_API_PATH/mod/ndu/channels',
          valueField: 'value',
          labelField: 'label'
        }
      }
    ],
    evaluate: (event, params) => {
      return event.channel === params.channelName ? 1 : 0
    }
  },
  {
    id: 'user_language_is',
    label: 'module.ndu.conditions.userSpeaks',
    description: `The user's language is {language}`,
    fields: [
      {
        type: 'select',
        key: 'language',
        label: 'language',
        placeholder: 'module.ndu.conditions.fields.placeholder.pickLanguage',
        dynamicOptions: {
          endpoint: 'API_PATH/admin/languages',
          path: 'installed',
          valueField: 'lang',
          labelField: 'name'
        }
      }
    ],
    evaluate: (event, params) => {
      return event.state.user.language === params.language ? 1 : 0
    }
  },
  {
    id: 'user_is_authenticated',
    label: 'module.ndu.conditions.userAuthenticated',
    evaluate: event => {
      return event.state.session.isAuthenticated ? 1 : 0
    }
  },
  {
    id: 'user_topic_source',
    label: 'module.ndu.conditions.userComingFromTopic',
    description: `The user's last topic was {topicName}`,
    fields: [
      {
        type: 'select',
        key: 'topicName',
        label: 'topic',
        placeholder: 'module.ndu.conditions.fields.placeholder.pickTopic',
        dynamicOptions: {
          endpoint: 'BOT_API_PATH/topics',
          valueField: 'name',
          labelField: 'name'
        }
      }
    ],
    evaluate: (event, params) => {
      const topics = event.state.session.lastTopics
      return topics && topics[topics.length - 1] === params.topicName ? 1 : 0
    }
  },
  {
    id: 'raw_js',
    label: 'module.ndu.conditions.customCode',
    description: `{label}`,
    fields: [
      {
        type: 'textarea',
        key: 'expression',
        label: 'code'
      }
    ],
    evaluate: (event, params) => {
      try {
        const fn = new Function('event', `return ${params.expression};`)
        return fn(event) ? 1 : 0
      } catch (err) {
        throw new Error(`\n\n${err}\nExpression "${params.expression}" in workflow ${params.wfName}`)
      }
    }
  },
  {
    id: 'user_already_spoke',
    label: 'module.ndu.conditions.userAlreadySpoke',
    evaluate: event => {
      const { lastMessages } = event.state.session
      return lastMessages && lastMessages.length > 0 ? 1 : 0
    }
  },
  {
    id: 'outside_flow_node',
    label: 'module.ndu.conditions.userNotInWorkflowOrBlock',
    evaluate: event => {
      return !event.state.context?.currentFlow && !event.state.context?.currentNode ? 1 : 0
    }
  },
  {
    id: 'custom_confidence',
    label: 'module.ndu.conditions.customPriority',
    description: `Confidence level of {confidence}`,
    fields: [
      {
        type: 'number',
        key: 'confidence',
        label: 'confidence'
      }
    ],
    evaluate: (_event, params) => {
      return params.confidence
    }
  },
  {
    id: 'always',
    label: 'module.ndu.conditions.alwaysTrue',
    evaluate: () => {
      return 1
    }
  },
  {
    id: 'type_text',
    label: 'module.ndu.conditions.userTyped',
    description: `The user typed {text}`,
    fields: [
      {
        key: 'candidate',
        label: 'module.ndu.conditions.fields.label.candidate',
        placeholder: 'module.ndu.conditions.fields.placeholder.oneWordPerLine',
        type: 'text_array',
        superInput: true,
        group: {
          addLabel: 'module.ndu.conditions.fields.label.addWord'
        }
      }
    ],
    advancedSettings: [
      {
        key: 'exactMatch',
        label: 'module.ndu.conditions.fields.label.exactMatch',
        type: 'checkbox'
      },
      {
        key: 'caseSensitive',
        label: 'module.ndu.conditions.fields.label.caseSensitive',
        type: 'checkbox'
      }
    ],
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
    label: 'module.ndu.conditions.userEndedWorkflow',
    fields: [
      {
        key: 'outcome',
        label: 'module.ndu.conditions.fields.label.workflowOutcome',
        placeholder: 'module.ndu.conditions.fields.placeholder.pickWorkflowOutcome',
        type: 'select',
        defaultValue: 'success',
        options: [
          { label: 'success', value: 'success' },
          { label: 'failure', value: 'failure' }
        ]
      },
      {
        key: 'ignoredWorkflows',
        defaultValue: ['misunderstood', 'workflow_ended', 'error'],
        label: 'module.ndu.conditions.fields.label.ignoredWorkflows',
        moreInfo: {
          label: 'module.ndu.conditions.fields.label.ignoredWorkflowsMoreInfo'
        },
        placeholder: 'module.ndu.conditions.fields.placeholder.workflowName',
        type: 'text_array',
        group: {
          addLabel: 'studio.flow.ignoredWorkflows.addLabel'
        }
      }
    ],
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
  },
  // TODO: These two conditions should be hidden from the UI
  {
    id: 'prompt_listening',
    label: 'A prompt is currently active and listening for user input',
    evaluate: (event: sdk.IO.IncomingEvent, _params) => {
      return event.state.context.activePrompt?.status === 'pending' ? 1 : 0
    }
  },
  {
    id: 'prompt_cancellable',
    label: 'A prompt is currently active and is cancellable',
    evaluate: (event: sdk.IO.IncomingEvent, _params) => {
      return event.state.context.activePrompt?.config?.cancellable ? 1 : 0
    }
  }
]
