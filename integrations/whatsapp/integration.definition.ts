import { IntegrationDefinition, messages } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import { z } from 'zod'

export default new IntegrationDefinition({
  name: 'whatsapp',
  version: '0.2.0',
  title: 'WhatsApp',
  description: 'This integration allows your bot to interact with WhatsApp.',
  icon: 'icon.svg',
  readme: 'readme.md',
  configuration: {
    schema: z.object({
      verifyToken: z.string(),
      phoneNumberId: z.string(),
      accessToken: z.string(),
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
          userPhone: {},
          phoneNumberId: {},
        },
      },
    },
  },
  user: {
    tags: {
      userId: {},
      name: {},
    },
  },
  actions: {},
  events: {},
  secrets: [...sentryHelpers.COMMON_SECRET_NAMES],
})
