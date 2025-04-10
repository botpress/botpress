/* bplint-disable */
import { z, IntegrationDefinition } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'

export default new IntegrationDefinition({
  name: 'webhook',
  version: '1.1.0',
  title: 'Webhook',
  description: 'Use webhooks to send and receive data from external systems and trigger workflows.',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration: {
    schema: z.object({
      secret: z
        .string()
        .optional()
        .describe(
          'Secret that must be sent with the request as a header called "x-bp-secret." Leave empty to allow all requests without a secret.'
        ),
      allowedOrigins: z
        .array(z.string())
        .optional()
        .describe(
          'List of allowed origins for CORS. Leaving this field empty will block all requests originating from a browser and only allow requests from a server.'
        ),
    }),
  },
  events: {
    event: {
      schema: z
        .object({
          body: z.any(),
          query: z.record(z.any()),
          path: z.string(),
          headers: z.record(
            z.union([
              z.string(),
              z.string().array(),
            ])
          ),
          method: z.enum(['GET', 'POST']),
        })
        .passthrough(),
    },
  },
  secrets: sentryHelpers.COMMON_SECRET_NAMES,
})
