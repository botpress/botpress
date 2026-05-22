import { IntegrationDefinition, z } from '@botpress/sdk'
import hitl from 'bp_modules/hitl'
import { actions, configuration, events } from './definitions'

// TODO(HITL): add back the ticket channel with freshdeskTicketId conversation tag to enable the bot to send messages into ticket threads

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
  entities: {
    ticket: {
      schema: z.object({
        // add your specific freshdesk fields here
      }),
    },
  },
  user: {
    tags: {
      freshdeskRequesterId: { title: 'Freshdesk Requester ID', description: 'The ID of the requester in Freshdesk' },
    },
  },
}).extend(hitl, (self) => ({
  entities: {
    hitlSession: self.entities.ticket,
  },
  channels: {
    hitl: {
      name: 'ticket', // this way the name of your channel will be 'ticket' instead of 'hitl'
    },
  },
}))
