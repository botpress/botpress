import { z, IntegrationDefinition } from '@botpress/sdk'
import { actions } from './definitions'
import { integrationName } from './package.json'

export default new IntegrationDefinition({
  name: integrationName,
  title: 'Odoo',
  description: 'Connect Botpress to Odoo records such as leads, contacts, and tickets.',
  version: '0.1.0',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({
      url: z.string().url().title('Odoo URL').describe('Base URL of the Odoo instance.'),
      database: z.string().min(1).title('Database').describe('Odoo database name.'),
      apiKey: z.string().secret().min(1).title('API Key').describe('Odoo API key used to authenticate requests.'),
    }),
  },
  actions,
})
