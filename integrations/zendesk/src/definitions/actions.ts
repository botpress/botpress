import z from 'zod'

export const ticketSchema = z.object({
  id: z.number(),
  subject: z.string(),
  description: z.string(),
  status: z.enum(['new', 'open', 'pending', 'hold', 'solved', 'closed']),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).nullable(),
  requester_id: z.number(),
  assignee_id: z.number().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  tags: z.array(z.string()),
})

export type Ticket = z.infer<typeof ticketSchema>

export const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  phone: z.string().optional(),
  photo: z.string().optional(),
  role: z.enum(['end-user', 'agent', 'admin']),
  created_at: z.string(),
  updated_at: z.string(),
  tags: z.array(z.string()),
  external_id: z.string().nullable(),
  user_fields: z.record(z.string()).optional(),
})

export type User = z.infer<typeof userSchema>

const createTicket = {
  title: 'Create Ticket',
  description: 'Creates a new ticket in Zendesk',
  input: {
    schema: z.object({
      subject: z.string().describe('Subject for the ticket'),
      comment: z.string().describe('Comment for the ticket'),
      requesterName: z.string().describe('Requester name'),
      requesterEmail: z.string().describe('Requester email'),
      __conversationId: z.string().describe('Internal: Conversation ID to bind the ticket to'),
    }),
    ui: {
      subject: {
        title: 'Ticket subject',
      },
      comment: {
        title: 'Ticket comment',
      },
      requesterName: {
        title: 'Requester name',
      },
      requesterEmail: {
        title: 'Requester email',
      },
    },
  },
  output: {
    schema: ticketSchema.extend({
      conversationId: z.string(),
      userId: z.string(),
    }),
  },
}

const getTicket = {
  title: 'Get ticket',
  description: 'Get Ticket by id.',
  input: {
    schema: z.object({
      ticketId: z.string().describe('The ID of the ticket'),
    }),
    ui: {
      ticketId: {
        title: 'Ticket id',
      },
    },
  },
  output: {
    schema: ticketSchema,
  },
}

const closeTicket = {
  title: 'Close ticket',
  description: 'Close a ticket by its id.',
  input: {
    schema: z.object({
      ticketId: z.string().describe('ID of the ticket to close'),
      comment: z.string().optional().describe('Closing comment'),
      authorId: z.string().describe('ID of the zendesk customer'),
    }),
    ui: {
      ticketId: {
        title: 'Ticket ID',
      },
      comment: {
        title: 'Closing comment',
      },
    },
  },
  output: {
    schema: ticketSchema,
  },
}

const findCustomer = {
  title: 'Find Customer',
  description: 'Find a Customer in Zendesk',
  input: {
    schema: z.object({
      query: z
        .string()
        .min(2)
        .describe('partial or full value of any user property, including name, email address, notes, or phone.'),
    }),
    ui: {
      query: {
        title: 'Search Query',
      },
    },
  },
  output: {
    schema: z.array(userSchema),
  },
}

export const actions = {
  getTicket,
  findCustomer,
  createTicket,
  closeTicket,
}
