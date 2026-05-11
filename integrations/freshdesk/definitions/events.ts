import { IntegrationDefinitionProps, z } from '@botpress/sdk'

const webhookTicketSchema = z.object({
  id: z.number().title('Ticket ID').describe('Freshdesk ticket ID.'),
  subject: z.string().optional().title('Subject').describe('Ticket subject.'),
  status: z.number().optional().title('Status').describe('Ticket status: 2=Open, 3=Pending, 4=Resolved, 5=Closed.'),
  priority: z.number().optional().title('Priority').describe('Ticket priority: 1=Low, 2=Medium, 3=High, 4=Urgent.'),
  requester_id: z.number().optional().title('Requester ID').describe('Freshdesk requester user ID.'),
  responder_id: z.number().optional().title('Responder ID').describe('Agent assigned to the ticket.'),
  group_id: z.number().optional().title('Group ID').describe('Group the ticket is assigned to.'),
  type: z.string().optional().title('Type').describe('Ticket category type.'),
  tags: z.array(z.string()).optional().title('Tags').describe('Tags associated with the ticket.'),
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
  agentReplied: {
    title: 'Agent Replied',
    description: 'Triggered when an agent adds a reply or note to a ticket.',
    schema: z.object({
      ticket: webhookTicketSchema.title('Ticket').describe('The ticket that received the reply.'),
      reply: z
        .object({
          body: z.string().title('Body').describe('HTML content of the reply.'),
          body_text: z.string().optional().title('Body Text').describe('Plain-text content of the reply.'),
          agent_id: z.number().optional().title('Agent ID').describe('ID of the agent who replied.'),
        })
        .title('Reply')
        .describe('The reply or note that was added.'),
    }),
    ui: {},
  },
} as const satisfies IntegrationDefinitionProps['events']
