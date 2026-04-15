import { z, IntegrationDefinitionProps } from '@botpress/sdk'

export const states = {
  credentials: {
    type: 'integration',
    schema: z.object({
      shopDomain: z.string().optional().title('Shop Domain').describe('The myshopify.com domain of the store'),
      accessToken: z
        .string()
        .optional()
        .title('Admin Access Token')
        .describe('Shopify Admin API expiring offline access token (60-min TTL)'),
      refreshToken: z
        .string()
        .optional()
        .title('Admin Refresh Token')
        .describe(
          'Used to obtain a new access token without merchant interaction. Expires after 90 days; merchant must re-authorize when this expires.'
        ),
      accessTokenExpiresAtSeconds: z
        .number()
        .optional()
        .title('Access Token Expires At (s)')
        .describe('Unix epoch seconds at which the access token expires.'),
      refreshTokenExpiresAtSeconds: z
        .number()
        .optional()
        .title('Refresh Token Expires At (s)')
        .describe('Unix epoch seconds at which the refresh token expires.'),
      webhookSubscriptionIds: z
        .array(z.string())
        .optional()
        .title('Webhook Subscription IDs')
        .describe('GIDs of webhook subscriptions created during register; used by unregister for cleanup'),
    }),
  },
} satisfies IntegrationDefinitionProps['states']
