import { z, IntegrationDefinition, messages } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import proactiveConversation from 'bp_modules/proactive-conversation'
import proactiveUser from 'bp_modules/proactive-user'

export default new IntegrationDefinition({
  name: 'vonage',
  version: '1.0.2',
  title: 'Vonage',
  description: 'Send and receive SMS messages.',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration: {
    schema: z.object({
      apiKey: z.string().min(1).describe('The API Key').title('API Key'),
      apiSecret: z.string().min(1).describe('The API Secret').title('API Secret'),
      signatureSecret: z.string().min(1).describe('The signature secret').title('Signature Secret'),
      useTestingApi: z.boolean().describe('Chooses if we should use the test api').title('Use Testing API'),
    }),
  },
  channels: {
    channel: {
      title: 'Channel',
      description: 'The vonage Channel',
      messages: { ...messages.defaults, bloc: messages.markdownBloc },
      message: {
        tags: {
          id: { title: 'ID', description: 'The id of the message' },
        },
      },
      conversation: {
        tags: {
          userId: { title: 'User ID', description: 'The User id' },
          channel: { title: 'Channel', description: 'The conversation channel' },
          channelId: { title: 'Channel ID', description: 'The channel id' },
        },
      },
    },
  },
  events: {},
  user: {
    tags: {
      userId: { title: 'User ID', description: 'The user id' },
      channel: { title: 'Channel', description: 'The channel of the user' },
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
      schema: z.object({
        channel: z.string().describe('The channel of the user').title('Channel'),
        userId: z.string().describe('The user id').title('User ID'),
      }),
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
