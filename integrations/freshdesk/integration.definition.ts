import { IntegrationDefinition, z } from '@botpress/sdk'
import hitl from './bp_modules/hitl'
import { actions, configuration, events } from './definitions'

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
  entities: {
    hitlTicket: {
      schema: z.object({
        priority: z
          .enum(['low', 'medium', 'high', 'urgent'])
          .title('Priority')
          .describe('Priority of the ticket.')
          .optional(),
        groupId: z.string().title('Group ID').describe('Freshdesk group ID to assign the ticket to.').optional(),
        tags: z.array(z.string()).title('Tags').describe('Tags to apply to the ticket.').optional(),
        chatbotName: z
          .string()
          .title('Chatbot Name')
          .describe('Name of the chatbot displayed in the ticket. Defaults to "Botpress".')
          .optional(),
        requesterName: z
          .string()
          .title('Requester Name')
          .describe('Name of the requester. Requires Requester Email when provided.')
          .optional(),
        requesterEmail: z
          .string()
          .title('Requester Email')
          .describe('Email of the requester. Required together with Requester Name if provided.')
          .optional(),
      }),
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
  user: {
    tags: {
      freshdeskRequesterId: { title: 'Freshdesk Requester ID', description: 'The ID of the requester in Freshdesk' },
      freshdeskAgentId: { title: 'Freshdesk Agent ID', description: 'The ID of the agent in Freshdesk' },
    },
  },
}).extend(hitl, (self) => ({
  entities: {
    hitlSession: self.entities.hitlTicket,
  },
  channels: {
    hitl: {
      title: 'Freshdesk Ticket (HITL)',
      description: 'Human in the loop channel for Freshdesk tickets',
      conversation: {
        tags: {
          freshdeskTicketId: {
            title: 'Freshdesk Ticket ID',
            description: 'The ID of the Freshdesk ticket linked to this HITL session',
          },
        },
      },
      message: {
        tags: {
          freshdeskCommentId: {
            title: 'Freshdesk Comment ID',
            description: 'The ID of the note or reply in Freshdesk',
          },
        },
      },
    },
  },
}))
