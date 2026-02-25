import { IntegrationDefinition } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import proactiveConversation from 'bp_modules/proactive-conversation'
import proactiveUser from 'bp_modules/proactive-user'
import typingIndicator from 'bp_modules/typing-indicator'
import { channels, configuration, entities, user } from './definitions'

export const INTEGRATION_NAME = 'twilio'
export const INTEGRATION_VERSION = '1.3.1'

export default new IntegrationDefinition({
  name: INTEGRATION_NAME,
  version: INTEGRATION_VERSION,
  title: 'Twilio',
  description: 'Send and receive messages, voice calls, emails, SMS, and more.',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration,
  channels,
  user,
  entities,
  actions: {},
  events: {},
  secrets: {
    ...sentryHelpers.COMMON_SECRET_NAMES,
    POSTHOG_KEY: {
      description: 'Posthog key for error dashboards',
    },
  },
  attributes: {
    category: 'Communication & Channels',
  },
})
  .extend(typingIndicator, () => ({ entities: {} }))
  .extend(proactiveConversation, ({ entities }) => ({
    entities: {
      conversation: entities.conversation,
    },
    actions: {
      getOrCreateConversation: {
        name: 'startConversation',
        title: 'Start proactive conversation',
        description: 'Start a proactive conversation given a user',
      },
    },
  }))
  .extend(proactiveUser, ({ entities }) => ({
    entities: { user: entities.user },
    actions: {
      getOrCreateUser: {
        name: 'getOrCreateUser',
        title: 'Get or create user',
        description: 'Get or create a user in the Twilio channel',
      },
    },
  }))
