import { IntegrationDefinition, z } from '@botpress/sdk'
import { actions } from './definitions'

export default new IntegrationDefinition({
  name: 'klaviyo',
  title: 'Klaviyo',
  description: 'Manage customer profiles, generate leads, and curate marketing campaigns',
  version: '0.1.19',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({ apiKey: z.string().min(1).secret().title('API Key').describe('Your Klaviyo Private API Key') }),
  },
  actions,
})
