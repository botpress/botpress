import { IntegrationDefinition } from '@botpress/sdk'
import { actions, configuration, events } from './definitions'

// TODO(HITL): add back the ticket channel with freshdeskTicketId conversation tag to enable the bot to send messages into ticket threads

export default new IntegrationDefinition({
  name: 'freshdesk',
  title: 'Freshdesk',
  description: 'Connect Botpress to Freshdesk to create, read, update, delete, and search support tickets.',
  version: '0.1.1',
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
  attributes: {
    category: 'Customer Support',
    repo: 'botpress',
  },
})
