import { IntegrationDefinitionProps, z } from '@botpress/sdk'

export const webhookTicketSchema = z.object({
  id: z.number().title('Ticket ID').describe('Freshdesk ticket ID.'),
  subject: z.string().nullish().title('Subject').describe('Ticket subject.'),
  status: z.number().nullish().title('Status').describe('Ticket status: 2=Open, 3=Pending, 4=Resolved, 5=Closed.'),
  priority: z.number().nullish().title('Priority').describe('Ticket priority: 1=Low, 2=Medium, 3=High, 4=Urgent.'),
  requester_id: z.number().nullish().title('Requester ID').describe('Freshdesk requester user ID.'),
  responder_id: z.number().nullish().title('Responder ID').describe('Agent assigned to the ticket.'),
  group_id: z.number().nullish().title('Group ID').describe('Group the ticket is assigned to.'),
  type: z.string().nullish().title('Type').describe('Ticket category type.'),
  tags: z.array(z.string()).nullish().title('Tags').describe('Tags associated with the ticket.'),
})

export const webhookReplySchema = z.object({
  body: z.string().title('Body').describe('HTML content of the reply.'),
  body_text: z.string().optional().title('Body Text').describe('Plain-text content of the reply.'),
  customer_email: z.string().optional().title('Customer Email').describe('Email of the customer who replied.'),
})

export const events = {
  ticketCreated: {
    title: 'Ticket Created',
    description: 'Triggered when a new ticket is created in Freshdesk.',
    schema: z.object({
      ticket: webhookTicketSchema.title('Ticket').describe('The newly created ticket.'),
    }),
    ui: {},
  },
  ticketUpdated: {
    title: 'Ticket Updated',
    description: 'Triggered when a ticket is updated (status, priority, or assignment change).',
    schema: z.object({
      ticket: webhookTicketSchema.title('Ticket').describe('The updated ticket.'),
    }),
    ui: {},
  },
  ticketReplied: {
    title: 'Ticket Replied',
    description: 'Triggered when a customer adds a reply to a ticket.',
    schema: z.object({
      ticket: webhookTicketSchema.title('Ticket').describe('The ticket that received the reply.'),
      reply: webhookReplySchema.title('Reply').describe('The reply that was added.'),
    }),
    ui: {},
  },
} as const satisfies IntegrationDefinitionProps['events']
