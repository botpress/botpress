import { IntegrationDefinitionProps, z } from '@botpress/sdk'

export const configuration = {
  schema: z.object({
    url: z.string().url().title('Odoo URL').describe('Base URL of the Odoo instance.'),
    database: z.string().min(1).title('Database').describe('Odoo database name.'),
    apiKey: z.string().secret().min(1).title('API Key').describe('Odoo API key used to authenticate requests.'),
  }),
} as const satisfies IntegrationDefinitionProps['configuration']
