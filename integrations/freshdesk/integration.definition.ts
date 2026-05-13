import { IntegrationDefinition, z } from '@botpress/sdk'
import { actions, configuration, events, states } from './definitions'

export default new IntegrationDefinition({
  name: 'freshdesk',
  title: 'Freshdesk',
  description: 'Connect Botpress to Freshdesk to create, read, update, delete, and search support tickets.',
  version: '0.2.0',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration,
  states,
  actions,
  events,
  user: {
    tags: {
      freshdeskRequesterId: { title: 'Freshdesk Requester ID' },
    },
  },
  channels: {
    ticket: {
      conversation: {
        tags: {
          freshdeskTicketId: { title: 'Freshdesk Ticket ID' },
        },
      },
      messages: {
        text: { schema: z.object({ text: z.string() }) },
      },
    },
  },
})
