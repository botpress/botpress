/* bplint-disable */
import { z, IntegrationDefinition, messages } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import proactiveConversation from 'bp_modules/proactive-conversation'
import proactiveUser from 'bp_modules/proactive-user'

const startConversationProps = {
  title: 'Start proactive conversation',
  description: 'Start a proactive conversation given a user',
  input: {
    schema: z.object({
      conversation: z.object({
        userId: z.string(),
        channelId: z.string(),
        channel: z.string(),
      }),
    }),
  },
  output: { schema: z.object({ conversationId: z.string() }) },
}

const createUserProps = {
  input: { schema: z.object({ user: z.object({ channel: z.string(), userId: z.string() }) }) },
  output: { schema: z.object({ userId: z.string() }) },
}

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
  actions: { startConversation: startConversationProps, getOrCreateUser: createUserProps },
  events: {},
  user: {
    tags: {
      userId: {},
      channel: {},
    },
  },
  secrets: sentryHelpers.COMMON_SECRET_NAMES,
  entities: {
    proactiveConversation: {
      schema: startConversationProps.input.schema.shape['conversation'],
    },
    proactiveUser: {
      schema: createUserProps.input.schema.shape['user'],
    },
  },
})
  .extend(proactiveConversation, ({ entities }) => ({
    entities: {
      conversation: entities.proactiveConversation,
    },
    actions: {
      getOrCreateConversation: {
        name: 'startConversation',
        title: startConversationProps.title,
        description: startConversationProps.description,
      },
    },
  }))
  .extend(proactiveUser, ({ entities }) => ({ entities: { user: entities.proactiveUser } }))
