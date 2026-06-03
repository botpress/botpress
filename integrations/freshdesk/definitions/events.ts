import { IntegrationDefinitionProps, z } from '@botpress/sdk'

export const ticketEventSchema = z.object({
  id: z.number().title('Ticket ID').describe('Freshdesk ticket ID.'),
  subject: z.string().nullish().title('Subject').describe('Ticket subject.'),
  status: z.enum(['open', 'pending', 'resolved', 'closed']).nullish().title('Status').describe('Ticket status.'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).nullish().title('Priority').describe('Ticket priority.'),
  requesterId: z.number().nullish().title('Requester ID').describe('Freshdesk requester user ID.'),
  responderId: z.number().nullish().title('Responder ID').describe('Agent assigned to the ticket.'),
  groupId: z.number().nullish().title('Group ID').describe('Group the ticket is assigned to.'),
  type: z.string().nullish().title('Type').describe('Ticket category type.'),
  tags: z.array(z.string()).nullish().title('Tags').describe('Tags associated with the ticket.'),
})

export const replyEventSchema = z.object({
  body: z.string().title('Body').describe('HTML content of the reply.'),
  bodyText: z.string().optional().title('Body Text').describe('Plain-text content of the reply.'),
  customerEmail: z.string().optional().title('Customer Email').describe('Email of the customer who replied.'),
})

export const events = {
  ticketCreated: {
    title: 'Ticket Created',
    description: 'Triggered when a new ticket is created in Freshdesk.',
    schema: z.object({
      ticket: ticketEventSchema.title('Ticket').describe('The newly created ticket.'),
    }),
    ui: {},
  },
  ticketUpdated: {
    title: 'Ticket Updated',
    description: 'Triggered when a ticket is updated (status, priority, or assignment change).',
    schema: z.object({
      ticket: ticketEventSchema.title('Ticket').describe('The updated ticket.'),
    }),
    ui: {},
  },
  ticketReplied: {
    title: 'Ticket Replied',
    description: 'Triggered when a customer adds a reply to a ticket.',
    schema: z.object({
      ticket: ticketEventSchema.title('Ticket').describe('The ticket that received the reply.'),
      reply: replyEventSchema.title('Reply').describe('The reply that was added.'),
    }),
    ui: {},
  },
} as const satisfies IntegrationDefinitionProps['events']
