import { z, IntegrationDefinition, messages } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'

export default new IntegrationDefinition({
  name: 'vonage',
  version: '0.4.3',
  title: 'Vonage',
  description: 'This integration allows your bot to interact with Vonage.',
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
      messages: messages.defaults,
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
        creation: { enabled: true, requiredTags: ['userId', 'channelId', 'channel'] },
      },
    },
  },
  actions: {},
  events: {},
  user: {
    tags: {
      userId: {},
      channel: {},
    },
    creation: { enabled: true, requiredTags: ['userId', 'channel'] },
  },
  secrets: sentryHelpers.COMMON_SECRET_NAMES,
})
