/* bplint-disable */
import { z, IntegrationDefinition, messages } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'

export default new IntegrationDefinition({
  name: 'twilio',
  version: '0.4.6',
  title: 'Twilio',
  description: 'Send and receive messages, voice calls, emails, SMS, and more.',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration: {
    schema: z.object({
      accountSID: z.string().min(1),
      authToken: z.string().min(1),
    }),
  },
  channels: {
    channel: {
      messages: { ...messages.defaults, markdown: messages.markdown },
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
