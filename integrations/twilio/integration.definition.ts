import { z, IntegrationDefinition, messages } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import proactiveConversation from 'bp_modules/proactive-conversation'
import proactiveUser from 'bp_modules/proactive-user'

export default new IntegrationDefinition({
  name: 'twilio',
  version: '1.0.0',
  title: 'Twilio',
  description: 'Send and receive messages, voice calls, emails, SMS, and more.',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration: {
    schema: z.object({
      accountSID: z.string().min(1),
      authToken: z.string().min(1),
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
      messages: { ...messages.defaults },
      message: {
        tags: {
          id: {},
        },
      },
      conversation: {
        tags: {
          userPhone: {},
          activePhone: {},
        },
      },
    },
  },
  actions: {},
  events: {},
  secrets: sentryHelpers.COMMON_SECRET_NAMES,
  user: {
    tags: {
      userPhone: {},
    },
  },
  entities: {
    user: {
      schema: z.object({ userPhone: z.string() }),
    },
    conversation: {
      schema: z.object({ userPhone: z.string(), activePhone: z.string() }),
    },
  },
  __advanced: {
    useLegacyZuiTransformer: true,
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
