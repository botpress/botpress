import { IntegrationDefinition, messages } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import { z } from 'zod'

export default new IntegrationDefinition({
  name: 'discord',
  version: '0.2.0',
  title: 'Discord',
  description: 'This integration allows your bot to interact with Discord.',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration: {
    schema: z.object({}),
  },
  states: {
    credentials: {
      type: 'integration',
      schema: z.object({
        refreshToken: z.string(),
        accessToken: z.string(),
        expiryDate: z.string(),
      }),
    },
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
      },
    },
  },
  user: {
    tags: {
      id: {},
    },
  },
  actions: {},
  events: {},
  secrets: {
    ...sentryHelpers.COMMON_SECRET_NAMES,
    BOT_TOKEN: {},
    CLIENT_ID: {},
    CLIENT_SECRET: {},
    APPLICATION_ID: {},
    PUBLIC_KEY: {},
  },
})
