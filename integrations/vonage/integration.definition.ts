/* bplint-disable */
import { z, IntegrationDefinition, messages } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import proactiveConversation from 'bp_modules/proactive-conversation'
import proactiveUser from 'bp_modules/proactive-user'

export default new IntegrationDefinition({
  name: 'vonage',
  version: '1.0.0',
  title: 'Vonage',
  description: 'Send and receive SMS messages.',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration: {
    schema: z.object({
      apiKey: z.string().min(1),
      apiSecret: z.string().min(1),
      signatureSecret: z.string().min(1),
      useTestingApi: z.boolean(),
    }),
  },
  channels: {
    channel: {
      messages: { ...messages.defaults },
      message: {
        tags: {
          id: {},
        },
      },
      conversation: {
        tags: {
          userId: {},
          channel: {},
          channelId: {},
        },
      },
    },
  },
  events: {},
  user: {
    tags: {
      userId: {},
      channel: {},
    },
  },
  secrets: sentryHelpers.COMMON_SECRET_NAMES,
  entities: {
    conversation: {
      schema: z.object({
        userId: z.string(),
        channelId: z.string(),
        channel: z.string(),
      }),
    },
    user: {
      schema: z.object({ channel: z.string(), userId: z.string() }),
    },
  },
})
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
        description: 'Get or create a user in the Vonage channel',
      },
    },
  }))
