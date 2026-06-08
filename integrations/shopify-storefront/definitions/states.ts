import { z, IntegrationDefinitionProps } from '@botpress/sdk'

// Admin access token is intentionally not persisted: Shopify expiring offline tokens
// (April 2026) make stored values useless after 60 minutes. The token is used in-memory
// inside the OAuth wizard to provision the Storefront API token, then discarded.
// If a future feature needs admin access, run it inside the OAuth callback or trigger
// a re-auth wizard step.
export const states = {
  credentials: {
    type: 'integration',
    schema: z.object({
      shopDomain: z.string().optional().title('Shop Domain').describe('The myshopify.com domain of the store'),
      storefrontAccessToken: z
        .string()
        .optional()
        .title('Storefront Access Token')
        .describe('Storefront API access token used to authenticate Storefront GraphQL requests'),
    }),
  },
} satisfies IntegrationDefinitionProps['states']
