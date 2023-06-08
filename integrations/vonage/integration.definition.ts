import { IntegrationDefinition, messages } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import { z } from 'zod'

export default new IntegrationDefinition({
  name: 'vonage',
  version: '0.2.0',
  title: 'Vonage',
  description: 'This integration allows your bot to interact with Vonage.',
  icon: 'icon.svg',
  readme: 'readme.md',
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
      tags: {
        messages: ['id'],
        conversations: ['userId', 'channelId', 'channel'],
      },
      conversation: { creation: { enabled: true, requiredTags: ['userId', 'channelId', 'channel'] } },
    },
  },
  tags: {
    users: ['userId', 'channel'],
  },
  actions: {},
  events: {},
  user: { creation: { enabled: true, requiredTags: ['userId', 'channel'] } },
  secrets: [...sentryHelpers.COMMON_SECRET_NAMES],
})
