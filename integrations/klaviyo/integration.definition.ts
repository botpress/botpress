import { IntegrationDefinition, z } from '@botpress/sdk'
import { integrationName } from './package.json'
import { actions } from './definitions'

export default new IntegrationDefinition({
  name: integrationName,
  version: '0.1.1',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({}),
  },
  configurations: {
    manual: {
      title: 'Manual Configuration',
      description: 'Manual configuration with your Klaviyo API key',
      schema: z.object({
        apiKey: z.string().min(1).secret().title('API Key').describe('Your Klaviyo Private API Key'),
        webhookSecret: z
          .string()
          .min(1)
          .secret()
          .optional()
          .title('Webhook Secret')
          .describe('Webhook secret for signature verification (optional)'),
      }),
    },
  },
  actions,
})
