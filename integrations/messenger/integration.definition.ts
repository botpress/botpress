import { z, IntegrationDefinition, messages } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'

export default new IntegrationDefinition({
  name: 'messenger',
  version: '0.4.5',
  title: 'Messenger',
  description: 'This integration allows your bot to interact with Messenger.',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration: {
    schema: z.object({
      appId: z.string().min(1),
      appSecret: z.string().min(1),
      verifyToken: z.string().min(1),
      pageId: z.string().min(1),
      accessToken: z.string().min(1),
    }),
  },
  channels: {
    channel: {
      messages: messages.defaults,
      message: {
        tags: { id: {}, recipientId: {}, senderId: {} },
      },
      conversation: {
        tags: { id: {}, recipientId: {}, senderId: {} },
        creation: { enabled: true, requiredTags: ['id'] },
      },
    },
  },
  actions: {},
  events: {},
  secrets: sentryHelpers.COMMON_SECRET_NAMES,
  user: {
    tags: { id: {} },
    creation: { enabled: true, requiredTags: ['id'] },
  },
})
