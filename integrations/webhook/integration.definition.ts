import { z, IntegrationDefinition } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'

export default new IntegrationDefinition({
  name: 'webhook',
  version: '0.4.0',
  title: 'Webhook',
  description:
    'Connect your chatbot to your systems with webhooks. Send and receive data from external systems and trigger workflows effortlessly.',
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
  secrets: sentryHelpers.COMMON_SECRET_NAMES,
})
