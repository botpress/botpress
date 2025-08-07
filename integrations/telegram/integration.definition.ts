/* bplint-disable */
import { z, IntegrationDefinition } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import typingIndicator from './bp_modules/typing-indicator'
import { telegramMessageChannels } from './definitions/channels'

export default new IntegrationDefinition({
  name: 'telegram',
  version: '1.0.0',
  title: 'Telegram',
  description: 'Engage with your audience in real-time.',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration: {
    schema: z.object({
      botToken: z.string().min(1),
    }),
  },
  channels: {
    channel: {
      messages: telegramMessageChannels,
      message: { tags: { id: {}, chatId: {} } },
      conversation: {
        tags: { id: {}, fromUserId: {}, fromUserUsername: {}, fromUserName: {}, chatId: {} },
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
  },
}).extend(typingIndicator, () => ({
  entities: {},
}))
