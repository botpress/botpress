import * as sdk from 'botpress/sdk'
import _ from 'lodash'

export const dialogConditions: sdk.Condition[] = [
  {
    id: 'user_channel_is',
    label: 'User is using a specific channel',
    description: `The user speaks on channel {channelName}`,
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
    description: `The user's language is {language}`,
    params: {
      language: {
        label: 'Language',
        type: 'list',
        list: {
          endpoint: 'API_PATH/admin/languages',
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
    description: `The user's last topic was {topicName}`,
    params: {
      topicName: {
        label: 'Name of the topic',
        type: 'list',
        list: {
          endpoint: 'BOT_API_PATH/topics',
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
    description: `{label}`,
    params: {
      expression: { label: 'Expression to evaluate', type: 'string' },
      label: { label: 'Custom label', type: 'string', defaultValue: 'Raw JS expression' }
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
  }
]
