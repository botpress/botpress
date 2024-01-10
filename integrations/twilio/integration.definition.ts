import { IntegrationDefinition, messages } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import { z } from 'zod'
import { INTEGRATION_NAME } from './src/const'

export default new IntegrationDefinition({
  name: INTEGRATION_NAME,
  version: '0.2.0',
  title: 'Twilio',
  description: 'This integration allows your bot to interact with Twilio.',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration: {
    schema: z.object({
      accountSID: z.string(),
      authToken: z.string(),
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
          activePhone: {},
        },
        creation: { enabled: true, requiredTags: ['userPhone', 'activePhone'] },
      },
    },
  },
  actions: {},
  events: {},
  secrets: sentryHelpers.COMMON_SECRET_NAMES,
  user: {
    tags: {
      userPhone: {},
    },
    creation: { enabled: true, requiredTags: ['userPhone'] },
  },
})
