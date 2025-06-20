import { z, IntegrationDefinition } from '@botpress/sdk'
import { integrationName } from './package.json'

export default new IntegrationDefinition({
  name: integrationName,
  version: '0.0.1',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({
      magento_domain: z.string().describe('The domain of the Magento instance (example www.test-domain.com)'),
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
          result: z.object({
            items: z.array(z.any()),
            search_criteria: z.object({}),
            total_count: z.number(),
          }),
        }),
      },
    },
    getStockItem: {
      title: 'Get Stock Item',
      description: 'Get stock information for a product by SKU',
      input: {
        schema: z.object({
          sku: z.string().describe('The SKU of the product to get stock information for'),
        }),
      },
      output: {
        schema: z.object({
          qty: z.number().optional().describe('The quantity in stock'),
          is_in_stock: z.boolean().optional().describe('Whether the item is in stock'),
          error: z.string().optional().describe('Error message if request failed'),
        }),
      },
    },
  },
})
