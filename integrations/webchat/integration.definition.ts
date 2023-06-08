import { IntegrationDefinition, messages } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import { z } from 'zod'

export default new IntegrationDefinition({
  name: 'webchat',
  version: '0.2.0',
  title: 'Webchat',
  description: 'This integration allows your bot to interact with Webchat.',
  icon: 'icon.svg',
  readme: 'readme.md',
  configuration: {
    schema: z.object({
      messagingUrl: z.string(),
      clientId: z.string().uuid(),
      clientToken: z.string(),
      adminKey: z.string(),
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
  states: {
    webchatintegration: {
      type: 'integration',
      schema: z.object({
        webhookToken: z.string(),
        webhook: z.object({
          token: z.string(),
        }),
      }),
    },
    userData: {
      type: 'user',
      schema: z.record(z.string()),
    },
  },
  actions: {
    getUserData: {
      input: {
        schema: z.object({
          userId: z.string().uuid(),
        }),
      },
      output: {
        schema: z.object({
          userData: z.record(z.string()).optional(),
        }),
      },
    },
  },
  events: {
    conversationStarted: {
      schema: z.object({
        userId: z.string().uuid(),
        conversationId: z.string().uuid(),
      }),
    },
  },
  secrets: [...sentryHelpers.COMMON_SECRET_NAMES],
})
