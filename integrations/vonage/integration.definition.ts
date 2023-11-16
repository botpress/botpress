import { IntegrationDefinition, messages } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import { z } from 'zod'
import { INTEGRATION_NAME } from './src/const'

export default new IntegrationDefinition({
  name: INTEGRATION_NAME,
  version: '0.2.0',
  title: 'Vonage',
  description: 'This integration allows your bot to interact with Vonage.',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration: {
    schema: z.object({
      apiKey: z.string(),
      apiSecret: z.string(),
      signatureSecret: z.string(),
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
