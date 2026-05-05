import { z, IntegrationDefinition } from '@botpress/sdk'
import { integrationName } from './package.json'

export default new IntegrationDefinition({
  name: integrationName,
  version: '0.1.0',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({
      url: z.string().url().title('Odoo URL'),
      database: z.string().min(1).title('Database'),
      apiKey: z.string().secret().min(1).title('API Key'),
    }),
  },
  actions: {
    getFields: {
      title: 'Get Odoo Fields',
      description: 'Get available fields for Odoo leads, contacts, or tickets.',
      input: {
        schema: z.object({
          model: z.enum(['Lead', 'Contact', 'Ticket']),
          fields: z.array(z.string()).optional(),
          attributes: z.array(z.string()).optional(),
          context: z.record(z.unknown()).optional(),
        }),
      },
      output: {
        schema: z.record(z.string(), z.record(z.string(), z.any())),
      },
    },
  },
})
