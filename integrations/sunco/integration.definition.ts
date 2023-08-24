import { IntegrationDefinition, messages } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import { z } from 'zod'

export default new IntegrationDefinition({
  name: 'sunco',
  version: '0.2.0',
  title: 'Sunshine Conversations',
  description: 'This integration allows your bot to interact with Sunshine Conversations.',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration: {
    schema: z.object({
      appId: z.string(),
      keyId: z.string(),
      keySecret: z.string(),
      webhookSecret: z.string(),
    }),
  },
  channels: {
    channel: {
      messages: messages.defaults,
      message: { tags: { id: {} } },
      conversation: { tags: { id: {} }, creation: { enabled: true, requiredTags: ['id'] } },
    },
  },
  actions: {},
  events: {},
  secrets: sentryHelpers.COMMON_SECRET_NAMES,
  user: {
    tags: {
      id: {},
    },
    creation: { enabled: true, requiredTags: ['id'] },
  },
})
