import { z, IntegrationDefinition } from '@botpress/sdk'
import { actions } from './definitions'

export default new IntegrationDefinition({
  name: 'kommo',
  title: 'Kommo',
  description: 'Manage leads and contacts in your Kommo CRM directly from your chatbot.',
  version: '0.1.0',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({
      subdomain: z.string().title('Subdomain').describe('Your Kommo subdomain (e.g., yourcompany.kommo.com)'),
      accessToken: z
        .string()
        .title('Access token')
        .describe('Long-lived access token from your Kommo private integration'),
    }),
  },
  actions,
})
