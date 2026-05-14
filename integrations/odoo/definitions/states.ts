import { IntegrationDefinitionProps, z } from '@botpress/sdk'

export const states = {
  account: {
    type: 'integration',
    schema: z.object({
      userId: z.number().title('User ID').describe('Odoo user ID associated with the configured API key.'),
    }),
  },
} as const satisfies IntegrationDefinitionProps['states']
