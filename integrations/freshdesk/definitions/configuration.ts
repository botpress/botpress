import { IntegrationDefinitionProps, z } from '@botpress/sdk'

export const configuration = {
  schema: z.object({
    domain: z
      .string()
      .min(1)
      .title('Freshdesk Subdomain')
      .describe('E.g. "yourcompany" from yourcompany.freshdesk.com'),
    apiKey: z
      .string()
      .secret()
      .min(1)
      .title('API Key')
      .describe('Your Freshdesk API key, found under Profile Settings.'),
  }),
} as const satisfies IntegrationDefinitionProps['configuration']
