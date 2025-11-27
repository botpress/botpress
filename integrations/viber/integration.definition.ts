import { z, IntegrationDefinition, messages } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'

export default new IntegrationDefinition({
  name: 'viber',
  version: '1.0.2',
  title: 'Viber',
  description: 'Send and receive SMS messages.',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration: {
    schema: z.object({
      authToken: z.string().min(1).title('Auth Token').describe('The authorization token'),
      botName: z.string().min(1).title('Bot Name').describe("The bot's name"),
      botAvatar: z.string().min(1).title('Bot Avatar').describe("The bot's avatar"),
    }),
  },
  channels: {
    channel: {
      title: 'Viber conversation',
      description: 'Channel for a Viber conversation',
      messages: { ...messages.defaults },
      message: {
        tags: {
          id: { title: 'Message ID', description: 'Viber message ID' },
        },
      },
      conversation: {
        tags: {
          id: { title: 'User ID', description: 'Viber user ID taking part in the conversation' },
        },
      },
    },
  },
  actions: {},
  events: {},
  secrets: sentryHelpers.COMMON_SECRET_NAMES,
  user: {
    tags: {
      id: { title: 'User ID', description: 'Viber user ID' },
    },
  },
})
