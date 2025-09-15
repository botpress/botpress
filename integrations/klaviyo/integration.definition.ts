import { IntegrationDefinition, z } from '@botpress/sdk'
import { actions } from './definitions'
import { integrationName } from './package.json'

export default new IntegrationDefinition({
  name: integrationName,
  title: 'Klaviyo',
  description: 'Connect with Klaviyo to manage customer profiles, segments, and marketing campaigns',
  version: '0.1.16',
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
      }),
    },
  },
  actions,
})
