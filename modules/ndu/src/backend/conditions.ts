import * as sdk from 'botpress/sdk'
import _ from 'lodash'

export const dialogConditions: sdk.Condition[] = [
  {
    id: 'user_channel_is',
    label: 'User is using a specific channel',
    description: 'The user speaks on channel {channelName}',
    params: {
      channelName: {
        label: 'Select a channel from the list',
        type: 'list',
        list: {
          endpoint: 'BOT_API_PATH/mod/ndu/channels',
          valueField: 'value',
          labelField: 'label'
        }
      }
    },
    evaluate: (event, params) => {
      return event.channel === params.channelName ? 1 : 0
    }
  },
  {
    id: 'user_language_is',
    label: 'User speaks a specific language',
    description: "The user's language is {language}",
    params: {
      language: {
        label: 'Language',
        type: 'list',
        list: {
          endpoint: 'API_PATH/admin/management/languages',
          path: 'installed',
          valueField: 'lang',
          labelField: 'name'
        }
      }
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
    description: "The user's last topic was {topicName}",
    params: {
      topicName: {
        label: 'Name of the topic',
        type: 'list',
        list: {
          endpoint: 'STUDIO_API_PATH/topics',
          valueField: 'name',
          labelField: 'name'
        }
      }
    },
    evaluate: (event, params) => {
      const topics = event.state.session.lastTopics
      return topics && topics[topics.length - 1] === params.topicName ? 1 : 0
    }
  },
  {
    id: 'raw_js',
    label: 'Raw JS expression',
    description: '{label}',
    params: {
      expression: { label: 'Expression to evaluate', type: 'string', rows: 5 },
      label: { label: 'Custom label', type: 'string', defaultValue: 'Raw JS expression' }
    },
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
    description: 'Confidence level of {confidence}',
    params: { confidence: { label: 'Confidence', type: 'number' } },
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
    description: 'The user typed {text}',
    params: {
      candidate: { label: 'One or multiple words to detect (one per line)', type: 'array', rows: 5 },
      exactMatch: { label: 'Must be an exact match', type: 'boolean', defaultValue: false },
      caseSensitive: { label: 'Case sensitive', type: 'boolean', defaultValue: false }
    },
    evaluate: (event, params) => {
      const { candidate, exactMatch, caseSensitive } = params

      const preview = caseSensitive ? event.preview : event.preview?.toLowerCase() || ''
      const userText = caseSensitive ? event.payload?.text : event.payload?.text?.toLowerCase() || ''

      const foundMatch = (candidate || []).find((originalWord: string) => {
        const word = caseSensitive ? originalWord : originalWord.toLowerCase()

        return (
          (!exactMatch && (preview.includes(word) || userText.includes(word))) ||
          (exactMatch && (preview === word || userText === word))
        )
      })

      return foundMatch ? 1 : 0
    }
  },
  {
    id: 'workflow_ended',
    label: 'The user ended a workflow',
    params: {
      outcome: {
        label: 'Workflow Outcome',
        type: 'list',
        subType: 'radio',
        defaultValue: 'success',
        list: {
          items: [
            { label: 'Success', value: 'success' },
            { label: 'Failure', value: 'failure' }
          ]
        }
      },
      ignoredWorkflows: {
        label: 'List of workflows to ignore (their completion will not activate this trigger)',
        type: 'array',
        rows: 5,
        defaultValue: ['misunderstood', 'workflow_ended', 'error']
      }
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
