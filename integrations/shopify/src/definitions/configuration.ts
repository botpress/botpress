import { IntegrationDefinitionProps } from '@botpress/sdk'
import { z } from 'zod'

export const configuration = {
  schema: z.object({
    shopName: z.string().describe('The shop name from the browser/URL.'),
    access_token: z.string().describe('The access token generated after adding our App to your shop.'),
  }),
  ui: {
    shopName: {
      title: 'Shop/Store Name',
      examples: [
        'If the  url to your store admin is https://admin.shopify.com/store/botpress-test-store, then the shop name is botpress-test-store',
      ],
    },
    access_token: {
      title: 'Admin API access token',
      examples: ['It is found in the app settings, in the API credentials'],
    },
  },
} satisfies IntegrationDefinitionProps['configuration']
