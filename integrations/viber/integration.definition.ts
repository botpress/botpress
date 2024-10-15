import { z, IntegrationDefinition, messages } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'

export default new IntegrationDefinition({
  name: 'viber',
  version: '0.4.4',
  title: 'Viber',
  description: 'This integration allows your bot to interact with Viber.',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration: {
    schema: z.object({
      authToken: z.string().min(1),
      botName: z.string().min(1),
      botAvatar: z.string().min(1),
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
          id: {},
        },
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
