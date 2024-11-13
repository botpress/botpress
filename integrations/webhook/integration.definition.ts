/* bplint-disable */
import { z, IntegrationDefinition } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'

export default new IntegrationDefinition({
  name: 'webhook',
  version: '1.0.1',
  title: 'Webhook',
  description: 'Use webhooks to send and receive data from external systems and trigger workflows.',
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
          body: z.any(),
          query: z.record(z.any()),
          path: z.string(),
          method: z.enum(['GET', 'POST']),
        })
        .passthrough(),
    },
  },
  secrets: sentryHelpers.COMMON_SECRET_NAMES,
})
