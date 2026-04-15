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
        .describe(
          'Shopify Admin access token obtained via OAuth. Used to (re-)provision the Storefront Access Token; not used for action execution.'
        ),
      storefrontAccessToken: z
        .string()
        .optional()
        .title('Storefront Access Token')
        .describe('Storefront API access token used to authenticate Storefront GraphQL requests'),
    }),
  },
} satisfies IntegrationDefinitionProps['states']
