import { IntegrationDefinition, messages } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import { z } from 'zod'

export const name = 'whatsapp'

export default new IntegrationDefinition({
  name,
  version: '0.2.0',
  title: 'WhatsApp',
  description: 'This integration allows your bot to interact with WhatsApp.',
  icon: 'icon.svg',
  readme: 'hub.md',
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
        creation: {
          enabled: true,
          requiredTags: ['userPhone', 'templateName'],
        },
        tags: {
          userPhone: {
            title: 'User phone number',
            description: 'Phone number of the Whatsapp user to start the conversation with.',
          },
          phoneNumberId: {
            title: 'Phone number ID',
            description: 'ID of the Whatsapp phone number to use as sender.',
          },
          templateName: {
            title: 'Message template name',
            description: 'Name of Message Template to start the conversation with.',
          },
          templateLanguage: {
            title: 'Message template language (optional)',
            description:
              'Language of Message Template to start the conversation with. Defaults to "en_US" (U.S. English).',
          },
          templateVariables: {
            title: 'Message template variables (optional)',
            description: 'JSON array representation of variable values to pass to the Message Template.',
          },
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
