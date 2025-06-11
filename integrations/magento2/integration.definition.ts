import { z, IntegrationDefinition } from '@botpress/sdk'
import { integrationName } from './package.json'

export default new IntegrationDefinition({
  name: integrationName,
  version: '0.0.1',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({
      magento_domain: z.string().describe('The domain of the Magento instance'),
      consumer_key: z.string().describe('The OAuth Consumer Key'),
      consumer_secret: z.string().describe('The OAuth Consumer Secret'),
      access_token: z.string().describe('The OAuth Access Token'),
      access_token_secret: z.string().describe('The OAuth Access Token Secret'),
      user_agent: z.string().optional().describe('The User Agent to use for the request'),
    }),
  },
  actions: {
    getProducts: {
      title: 'Get Products',
      description: 'Get products from the Magento instance',
      input: {
        schema: z.object({
          searchCriteria: z.string().optional().describe('The search criteria to use for the request'),
        }),
      },
      output: {
        schema: z.object({
          products: z.array(
            z.object({
              id: z.number(),
              name: z.string(),
            })
          ),
        }),
      },
    },
  },
})
