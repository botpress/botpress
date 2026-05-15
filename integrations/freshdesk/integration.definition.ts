import { IntegrationDefinition } from '@botpress/sdk'
import { actions, configuration, events } from './definitions'

export default new IntegrationDefinition({
  name: 'freshdesk',
  title: 'Freshdesk',
  description: 'Connect Botpress to Freshdesk to create, read, update, delete, and search support tickets.',
  version: '0.4.0',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration,
  actions,
  events,
  user: {
    tags: {
      freshdeskRequesterId: { title: 'Freshdesk Requester ID', description: 'The ID of the requester in Freshdesk' },
    },
  },
})
