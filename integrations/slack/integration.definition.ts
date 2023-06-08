import { IntegrationDefinition, messages } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import { z } from 'zod'

export default new IntegrationDefinition({
  name: 'slack',
  version: '0.2.0',
  title: 'Slack',
  description: 'This integration allows your bot to interact with Slack.',
  icon: 'icon.svg',
  readme: 'readme.md',
  configuration: {
    schema: z.object({
      botToken: z.string(),
      signingSecret: z.string(),
    }),
  },
  channels: {
    channel: {
      messages: messages.defaults,
      message: { tags: { ts: {} } },
      conversation: {
        tags: { id: {} },
        creation: { enabled: true, requiredTags: ['id'] },
      },
    },
  },
  actions: {
    addReaction: {
      input: {
        schema: z.object({
          name: z.string(),
          channel: z.string(),
          timestamp: z.string(),
        }),
      },
      output: {
        schema: z.object({}),
      },
    },
  },
  events: {},
  secrets: [...sentryHelpers.COMMON_SECRET_NAMES],
  user: {
    tags: { id: {} },
    creation: { enabled: true, requiredTags: ['id'] },
  },
})
