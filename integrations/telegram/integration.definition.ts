import { IntegrationDefinition, messages } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import { INTEGRATION_NAME } from 'src/const'
import { z } from 'zod'

export default new IntegrationDefinition({
  name: INTEGRATION_NAME,
  version: '0.2.0',
  title: 'Telegram',
  description: 'This integration allows your bot to interact with Telegram.',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration: {
    schema: z.object({
      botToken: z.string(),
    }),
  },
  channels: {
    channel: {
      messages: messages.defaults,
      message: { tags: { id: {}, senderId: {}, chatId: {} } },
      conversation: {
        tags: { id: {}, senderId: {}, chatId: {} },
        creation: { enabled: true, requiredTags: ['id'] },
      },
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
