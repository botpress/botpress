import { IntegrationDefinition, messages } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import { z } from 'zod'

export default new IntegrationDefinition({
  name: 'twilio',
  version: '0.2.0',
  title: 'Twilio',
  description: 'This integration allows your bot to interact with Twilio.',
  icon: 'icon.svg',
  readme: 'readme.md',
  configuration: {
    schema: z.object({
      accountSID: z.string(),
      authToken: z.string(),
    }),
  },
  channels: {
    channel: {
      messages: messages.defaults,
      tags: {
        messages: ['id'],
        conversations: ['userPhone', 'activePhone'],
      },
      conversation: { creation: { enabled: true, requiredTags: ['userPhone', 'activePhone'] } },
    },
  },
  tags: {
    users: ['userPhone'],
  },
  actions: {},
  events: {},
  user: { creation: { enabled: true, requiredTags: ['userPhone'] } },
  secrets: [...sentryHelpers.COMMON_SECRET_NAMES],
})
