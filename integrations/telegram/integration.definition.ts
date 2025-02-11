/* bplint-disable */
import { z, IntegrationDefinition, messages } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import typingIndicator from './bp_modules/typing-indicator'

export default new IntegrationDefinition({
  name: 'telegram',
  version: '0.7.0',
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
      messages: {
        ...messages.defaults,
        markdown: messages.markdown,
        audio: {
          ...messages.defaults.audio,
          schema: messages.defaults.audio.schema.extend({
            caption: z.string().optional().describe('The caption/transcription of the audio message'),
          }),
        },
      },
      message: { tags: { id: {}, chatId: {} } },
      conversation: {
        tags: { id: {}, fromUserId: {}, fromUserUsername: {}, fromUserName: {}, chatId: {} },
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
}).extend(typingIndicator, () => ({
  entities: {},
}))
