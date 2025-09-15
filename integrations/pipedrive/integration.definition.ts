import { IntegrationDefinition, z } from '@botpress/sdk'
import { actions } from './definitions'

export default new IntegrationDefinition({
  name: 'pipedrive',
  title: 'Pipedrive',
  description: 'Manage contacts, deals and more from your chatbot.',
  version: '0.1.0',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({
      apiKey: z.string().min(1).secret().describe('Your Pipedrive API Key'),
    }),
  },
  actions,
})
