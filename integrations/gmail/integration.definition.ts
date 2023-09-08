import { IntegrationDefinition, messages } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import { z } from 'zod'

export default new IntegrationDefinition({
  name: 'gmail',
  version: '0.2.0',
  title: 'Gmail',
  description: 'This integration allows your bot to interact with Gmail.',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration: {
    schema: z.object({}).passthrough(),
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
          email: {},
          subject: {},
          references: {},
          cc: {},
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
  states: {
    thread: {
      type: 'conversation',
      schema: z.object({
        inReplyTo: z.string(),
      }),
    },
    configuration: {
      type: 'integration',
      schema: z.object({
        refreshToken: z.string(),
        lastHistoryId: z.string().optional(),
      }),
    },
  },
  secrets: {
    ...sentryHelpers.COMMON_SECRET_NAMES,
    CLIENT_ID: { description: 'Gmail Client ID' },
    CLIENT_SECRET: { description: 'Gmail Client Secret' },
    TOPIC_NAME: {},
  },
})
