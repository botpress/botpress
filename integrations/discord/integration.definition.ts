import { IntegrationDefinition, messages } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import { z } from 'zod'

export default new IntegrationDefinition({
  name: 'discord',
  version: '0.2.0',
  configuration: {
    schema: z.object({
      apikey: z.string(),
      apiSecret: z.string(),
    }),
  },
  channels: {
    channel: {
      messages: messages.defaults,
      tags: {
        messages: ['id'],
        conversations: ['id'],
      },
    },
  },
  tags: {
    users: ['id'],
  },
  actions: {},
  events: {},
  secrets: [...sentryHelpers.COMMON_SECRET_NAMES],
})
