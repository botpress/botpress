import { IntegrationDefinition, z } from '@botpress/sdk'
import { actions, configuration, events } from './definitions'

export default new IntegrationDefinition({
  name: 'freshdesk',
  title: 'Freshdesk',
  description: 'Connect Botpress to Freshdesk to create, read, update, delete, and search support tickets.',
  version: '0.1.0',
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
  channels: {
    ticket: {
      title: 'Ticket',
      description: 'A Freshdesk support ticket channel for managing customer support conversations',
      conversation: {
        tags: {
          freshdeskTicketId: { title: 'Freshdesk Ticket ID', description: 'The ID of the ticket in Freshdesk' },
        },
      },
      messages: {
        text: { schema: z.object({ text: z.string() }) },
      },
    },
  },
})
