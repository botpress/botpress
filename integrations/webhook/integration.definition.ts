import { IntegrationDefinition } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import { z } from 'zod'

export default new IntegrationDefinition({
  name: 'webhook',
  version: '0.2.0',
  title: 'Webhook',
  description: 'This integration allows your bot to interact with Webhook.',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration: {
    schema: z.object({
      secret: z.string().optional(),
    }),
  },
  events: {
    event: {
      schema: z
        .object({
          body: z.record(z.any()),
          query: z.record(z.any()),
          path: z.string(),
          method: z.enum(['GET', 'POST']),
        })
        .passthrough(),
    },
  },
  secrets: [...sentryHelpers.COMMON_SECRET_NAMES],
})
