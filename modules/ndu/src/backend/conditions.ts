import * as sdk from 'botpress/sdk'
import _ from 'lodash'

export const conditionsDefinitions: sdk.Condition[] = [
  {
    id: 'user_intent_is',
    label: 'User asks something (intent)',
    description: `The user's intention is {intentName}`,
    params: {
      intentName: { label: 'Name of intent', type: 'string' }
    },
    editor: {
      module: 'nlu',
      component: 'LiteEditor'
    },
    evaluate: (event, params) => {
      return _.get(event, 'nlu.intent.name') === params.intentName ? event.nlu.intent.confidence : 0
    }
  },
  {
    id: 'user_channel_is',
    label: 'User is using a specific channel',
    description: `The user speaks on channel {channelName}`,
    params: {
      channelName: { label: 'Name of the channel', type: 'string' }
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
    evaluate: (_params, event) => {
      return event.state.session.isAuthenticated ? 1 : 0
    }
  },
  {
    id: 'user_topic_source',
    label: 'User is coming from a specific topic',
    params: { topicName: { label: 'Name of the topic', type: 'string' } },
    evaluate: (params, event) => {
      const topics = event.state.session.lastTopics
      return topics && topics[topics.length - 1] === params.topicName ? 1 : 0
    }
  },
  {
    id: 'user_already_spoke',
    label: 'User has already spoke with the bot',
    evaluate: (_params, event) => {
      const { lastMessages } = event.state.session
      return lastMessages && lastMessages.length > 0 ? 1 : 0
    }
  }
]
