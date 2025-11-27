import { z, IntegrationDefinition } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import typingIndicator from './bp_modules/typing-indicator'
import { telegramMessageChannels } from './definitions/channels'

export default new IntegrationDefinition({
  name: 'telegram',
  version: '1.0.2',
  title: 'Telegram',
  description: 'Engage with your audience in real-time.',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration: {
    schema: z.object({
      botToken: z.string().min(1).describe('Bot Token').title('Bot Token'),
    }),
  },
  channels: {
    channel: {
      title: 'Channel',
      description: 'Telegram Channel',
      messages: telegramMessageChannels,
      message: {
        tags: {
          id: { title: 'ID', description: 'The message id' },
          chatId: { title: 'Chat ID', description: 'The message Chat id' },
        },
      },
      conversation: {
        tags: {
          id: { title: 'ID', description: 'The conversation ID' },
          fromUserId: { title: 'From User ID', description: 'The conversation From User id' },
          fromUserUsername: { title: 'From User UserName', description: 'The converstation from user username' },
          fromUserName: { title: 'From User Name', description: 'The conversation from user name' },
          chatId: { title: 'Chat ID', description: 'The conversation Chat id' },
        },
      },
    },
  },
  actions: {},
  events: {},
  secrets: sentryHelpers.COMMON_SECRET_NAMES,
  user: {
    tags: {
      id: { title: 'ID', description: 'The id of the user' },
    },
  },
}).extend(typingIndicator, () => ({
  entities: {},
}))
