import * as sdk from 'botpress/sdk'
import _ from 'lodash'

export const dialogConditions: sdk.Condition[] = [
  {
    id: 'user_channel_is',
    label: 'User is using a specific channel',
    description: `The user speaks on channel {channelName}`,
    params: {
      fields: [{
        type: 'select',
        key: 'channelName',
        label: 'Select a channel from the list',
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
    label: 'User speaks a specific language',
    description: `The user's language is {language}`,
    params: {
      fields: [{
        type: 'select',
        key: 'language',
        label: 'Language',
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
    label: 'The user is authenticated',
    evaluate: event => {
      return event.state.session.isAuthenticated ? 1 : 0
    }
  },
  {
    id: 'user_topic_source',
    label: 'User is coming from a specific topic',
    description: `The user's last topic was {topicName}`,
    params: {
      fields: [{
        type: 'select',
        key: 'topicName',
        label: 'Name of the topic',
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
    label: 'Raw JS Expression',
    description: `{label}`,
    params: {
      fields: [
        {
          type: 'textarea',
          key: 'expression',
          label: 'Expression to Evaluate'
        },
        {
          type: 'text',
          key: 'label',
          label: 'Custom Label'
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
    label: 'User has already spoke with the bot',
    evaluate: event => {
      const { lastMessages } = event.state.session
      return lastMessages && lastMessages.length > 0 ? 1 : 0
    }
  },
  {
    id: 'outside_flow_node',
    label: 'User is not in any flow or node',
    evaluate: event => {
      return !event.state.context?.currentFlow && !event.state.context?.currentNode ? 1 : 0
    }
  },
  {
    id: 'custom_confidence',
    label: 'Custom confidence level',
    description: `Confidence level of {confidence}`,
    params: {
      fields: [{ type: 'number', key: 'confidence', label: 'Confidence' }]
    },
    evaluate: (_event, params) => {
      return params.confidence
    }
  },
  {
    id: 'always',
    label: 'This condition is always true',
    evaluate: () => {
      return 1
    }
  },
  {
    id: 'type_text',
    label: 'The user typed something specific',
    description: `The user typed {text}`,
    params: {
      fields: [
        {
          key: 'candidate',
          label: 'One or multiple words to detect',
          type: 'text_array',
          group: {
            addLabel: 'studio.flow.condition.addCondition'
          }
        }
      ],
      advancedSettings: [
        {
          key: 'exactMatch',
          label: 'Must be an exact match',
          type: 'checkbox'
        },
        {
          key: 'caseSensitive',
          label: 'Case sensitive',
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
    label: 'The user ended a workflow',
    params: {
      fields: [
        {
          key: 'outcome',
          label: 'Workflow Outcome',
          type: 'select',
          options: [
            { label: 'Success', value: 'success' },
            { label: 'Failure', value: 'failure' }
          ]
        },
        {
          key: 'ignoredWorkflows',
          label: 'List of workflows to ignore (their completion will not activate this trigger)',
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
