import { z, IntegrationDefinition, messages } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import proactiveConversation from 'bp_modules/proactive-conversation'
import proactiveUser from 'bp_modules/proactive-user'

export const INTEGRATION_NAME = 'twilio'
export const INTEGRATION_VERSION = '1.0.3'
export default new IntegrationDefinition({
  name: INTEGRATION_NAME,
  version: INTEGRATION_VERSION,
  title: 'Twilio',
  description: 'Send and receive messages, voice calls, emails, SMS, and more.',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration: {
    schema: z.object({
      accountSID: z.string().min(1).describe('The account SID').title('Account SID'),
      authToken: z.string().min(1).describe('The token for authentication').title('Authorization token'),
      downloadMedia: z
        .boolean()
        .default(true)
        .title('Download Media')
        .describe(
          'Automatically download media files using the Files API for content access. If disabled, temporary Twilio media URLs will be used, which require authentication.'
        ),
      downloadedMediaExpiry: z
        .number()
        .default(24)
        .optional()
        .title('Downloaded Media Expiry')
        .describe(
          'Expiry time in hours for downloaded media files. An expiry time of 0 means the files will never expire.'
        ),
    }),
  },
  channels: {
    channel: {
      title: 'Conversation Channel',
      description: 'A channel for sending and receiving messages through Twilio Conversations',
      messages: messages.defaults,
      message: {
        tags: {
          id: {
            title: 'Message ID',
            description: 'The Twilio message ID',
          },
        },
      },
      conversation: {
        tags: {
          userPhone: {
            title: 'User Phone',
            description: 'The phone number of the user',
          },
          activePhone: {
            title: 'Active Phone',
            description: 'The phone number of the active user',
          },
        },
      },
    },
  },
  actions: {},
  events: {},
  secrets: {
    ...sentryHelpers.COMMON_SECRET_NAMES,
    POSTHOG_KEY: {
      description: 'Posthog key for error dashboards',
    },
  },
  user: {
    tags: {
      userPhone: {
        title: 'User Phone',
        description: 'The phone number of the user',
      },
    },
  },
  entities: {
    user: {
      schema: z.object({ userPhone: z.string().describe('The phone number of the user').title('User Phone Number') }),
    },
    conversation: {
      schema: z.object({
        userPhone: z.string().describe('The phone number of the user').title('User Phone Number'),
        activePhone: z.string().describe('The Phone number the message was sent from').title('Active Phone Number'),
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
        description: 'Get or create a user in the Twilio channel',
      },
    },
  }))
