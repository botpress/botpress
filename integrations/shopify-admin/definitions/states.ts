import { z, IntegrationDefinitionProps } from '@botpress/sdk'

export const states = {
  credentials: {
    type: 'integration',
    schema: z.object({
      shopDomain: z.string().optional().title('Shop Domain').describe('The myshopify.com domain of the store'),
      accessToken: z
        .string()
        .optional()
        .title('Access Token')
        .describe('The Shopify Admin API access token obtained via OAuth'),
      webhookSubscriptionIds: z
        .array(z.string())
        .optional()
        .title('Webhook Subscription IDs')
        .describe('GIDs of webhook subscriptions created during register; used by unregister for cleanup'),
    }),
  },
} satisfies IntegrationDefinitionProps['states']
