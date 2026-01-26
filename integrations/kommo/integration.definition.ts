import { z, IntegrationDefinition } from '@botpress/sdk'
import { actions } from './definitions'

export default new IntegrationDefinition({
  name: 'kommo',
  title: 'Kommo',
  version: '0.1.0',
  readme: 'hub.md',
  icon: 'icon.svg',

  // User provides these when configuring the integration
  configuration: {
    schema: z.object({
      baseDomain: z.string().describe('Your Kommo subdomain (e.g., yourcompany.kommo.com)'),
      accessToken: z.string().describe('Long-lived access token from your Kommo private integration'),
    }),
  },
  actions,
})
