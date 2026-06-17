import { z, IntegrationDefinition } from '@botpress/sdk'
import typingIndicator from './bp_modules/typing-indicator'
import { telegramMessageChannels } from './definitions/channels'

export default new IntegrationDefinition({
  name: 'telegram',
  version: '1.0.9',
  title: 'Telegram',
  description: 'Engage with your audience in real-time.',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration: {
    identifier: {
      linkTemplateScript: 'linkTemplate.vrl',
    },
    schema: z.object({
      botToken: z
        .string()
        .min(1)
        .secret()
        .hidden()
        .optional()
        .title('Bot Token')
        .describe('Legacy Telegram bot token. New installations store this in integration state.'),
      typingIndicatorEmoji: z
        .boolean()
        .default(false)
        .title('Typing Indicator Emoji')
        .describe('Temporarily add an emoji reaction to received messages to indicate when bot is processing message'),
    }),
  },
  states: {
    credentials: {
      type: 'integration',
      schema: z.object({
        botToken: z.string().title('Bot Token').min(1).secret().describe('The Telegram bot token'),
      }),
    },
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

  user: {
    tags: {
      id: { title: 'ID', description: 'The id of the user' },
    },
  },
  attributes: {
    category: 'Communication & Channels',
    guideSlug: 'telegram',
    repo: 'botpress',
  },
}).extend(typingIndicator, () => ({
  entities: {},
}))
