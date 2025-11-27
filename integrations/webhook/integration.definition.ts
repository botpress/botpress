import { z, IntegrationDefinition } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'

export default new IntegrationDefinition({
  name: 'webhook',
  version: '1.1.2',
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
      title: 'Event',
      description: 'The event triggered in the webhook',
      schema: z
        .object({
          body: z.any().describe('The body of the event').title('Body'),
          query: z.record(z.any()).describe('The query of the event').title('Query'),
          path: z.string().describe('The path of the event').title('Path'),
          headers: z
            .record(z.union([z.string(), z.string().array()]))
            .describe('The headers of the event')
            .title('Headers'),
          method: z.enum(['GET', 'POST']).describe('The method of the event').title('Method'),
        })
        .passthrough(),
    },
  },
  secrets: sentryHelpers.COMMON_SECRET_NAMES,
})
