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
    webhookSecret: z
      .string()
      .secret()
      .optional()
      .title('Webhook Secret')
      .describe(
        'Optional shared secret to authenticate incoming webhooks. Set this value and add it as the X-Webhook-Secret header in each Freshdesk Automation webhook action.'
      ),
  }),
} as const satisfies IntegrationDefinitionProps['configuration']
