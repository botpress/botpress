import { IntegrationDefinition, messages } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import { z } from 'zod'

const { text } = messages.defaults

export default new IntegrationDefinition({
  name: 'github',
  title: 'GitHub',
  description: 'This integration allows your bot to interact with GitHub.',
  icon: 'icon.svg',
  readme: 'readme.md',
  version: '0.2.0',
  configuration: {
    schema: z.object({
      owner: z.string(),
      repo: z.string(),
      token: z.string(),
    }),
  },
  actions: {},
  events: {},
  channels: {
    pullRequest: {
      tags: {
        conversations: ['number'],
        messages: ['id'],
      },
      messages: {
        text,
      },
    },
    discussion: {
      tags: {
        conversations: ['number'],
        messages: ['id'],
      },
      messages: {
        text,
      },
    },
    issue: {
      tags: {
        conversations: ['number'],
        messages: ['id'],
      },
      messages: {
        text,
      },
    },
  },
  tags: {
    users: ['id'],
  },
  states: {
    configuration: {
      type: 'integration',
      schema: z.object({
        webhookSecret: z.string().optional(),
        webhookId: z.number().optional(),
        botUserId: z.number().optional(),
      }),
    },
  },
  secrets: [...sentryHelpers.COMMON_SECRET_NAMES],
})
