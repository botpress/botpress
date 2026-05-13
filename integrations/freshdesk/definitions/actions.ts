import { IntegrationDefinitionProps, z } from '@botpress/sdk'

const ticketSchema = z.object({
  id: z.number().title('ID').describe('Unique Freshdesk ticket ID.'),
  subject: z.string().title('Subject').describe('Subject of the ticket.'),
  description: z.string().nullish().title('Description').describe('HTML content of the ticket description.'),
  description_text: z.string().nullish().title('Description Text').describe('Plain-text ticket description.'),
  status: z.enum(['open', 'pending', 'resolved', 'closed']).title('Status').describe('Ticket status.'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).title('Priority').describe('Ticket priority.'),
  source: z.number().nullish().title('Source').describe('Channel through which the ticket was created.'),
  email: z.string().nullish().title('Email').describe('Requester email address.'),
  name: z.string().nullish().title('Name').describe('Requester name.'),
  requester_id: z.number().nullish().title('Requester ID').describe('Freshdesk requester user ID.'),
  responder_id: z.number().nullish().title('Responder ID').describe('Agent assigned to the ticket.'),
  group_id: z.number().nullish().title('Group ID').describe('Group the ticket is assigned to.'),
  type: z.string().nullish().title('Type').describe('Ticket category type.'),
  tags: z.array(z.string()).nullish().title('Tags').describe('Tags associated with the ticket.'),
  cc_emails: z.array(z.string()).nullish().title('CC Emails').describe('List of CC email addresses.'),
  due_by: z.string().nullish().title('Due By').describe('ISO 8601 timestamp for when the ticket is due.'),
  created_at: z.string().title('Created At').describe('ISO 8601 timestamp of ticket creation.'),
  updated_at: z.string().title('Updated At').describe('ISO 8601 timestamp of last update.'),
  custom_fields: z
    .record(z.string(), z.unknown())
    .nullish()
    .title('Custom Fields')
    .describe('Custom field key-value pairs.'),
})

export const actions = {
  createTicket: {
    title: 'Create Ticket',
    description: 'Creates a new ticket in Freshdesk.',
    input: {
      schema: z.object({
        subject: z.string().title('Subject').describe('Subject of the ticket.'),
        description: z.string().title('Description').describe('HTML content of the ticket description.'),
        email: z.string().title('Email').describe('Requester email address.'),
        priority: z
          .enum(['low', 'medium', 'high', 'urgent'])
          .default('medium')
          .title('Priority')
          .describe('Ticket priority: "low", "medium", "high", or "urgent".'),
        status: z
          .enum(['open', 'pending', 'resolved', 'closed'])
          .default('open')
          .title('Status')
          .describe('Ticket status: "open", "pending", "resolved", or "closed".'),
        tags: z.array(z.string()).optional().title('Tags').describe('Tags to associate with the ticket.'),
        custom_fields: z
          .record(z.string(), z.unknown())
          .optional()
          .title('Custom Fields')
          .describe('Custom field key-value pairs.'),
      }),
    },
    output: {
      schema: z.object({
        id: z.number().title('ID').describe('Unique Freshdesk ticket ID.'),
        subject: z.string().title('Subject').describe('Subject of the ticket.'),
        status: z.enum(['open', 'pending', 'resolved', 'closed']).title('Status').describe('Ticket status.'),
        priority: z.enum(['low', 'medium', 'high', 'urgent']).title('Priority').describe('Ticket priority.'),
        createdAt: z.string().title('Created At').describe('ISO 8601 timestamp of ticket creation.'),
        url: z.string().title('URL').describe('URL to view the ticket in Freshdesk.'),
      }),
    },
  },
  getTicket: {
    title: 'Get Ticket',
    description: 'Retrieves a single Freshdesk ticket by ID.',
    input: {
      schema: z.object({
        ticketId: z.string().title('Ticket ID').describe('The Freshdesk ticket ID.'),
      }),
    },
    output: {
      schema: z.object({
        id: z.number().title('ID').describe('Unique Freshdesk ticket ID.'),
        subject: z.string().title('Subject').describe('Subject of the ticket.'),
        description: z.string().nullish().title('Description').describe('HTML content of the ticket description.'),
        status: z.enum(['open', 'pending', 'resolved', 'closed']).title('Status').describe('Ticket status.'),
        priority: z.enum(['low', 'medium', 'high', 'urgent']).title('Priority').describe('Ticket priority.'),
        requesterId: z.number().nullish().title('Requester ID').describe('Freshdesk requester user ID.'),
        responderId: z.number().nullish().title('Responder ID').describe('Agent assigned to the ticket.'),
        groupId: z.number().nullish().title('Group ID').describe('Group the ticket is assigned to.'),
        createdAt: z.string().title('Created At').describe('ISO 8601 timestamp of ticket creation.'),
        updatedAt: z.string().title('Updated At').describe('ISO 8601 timestamp of last update.'),
        tags: z.array(z.string()).nullish().title('Tags').describe('Tags associated with the ticket.'),
        custom_fields: z
          .record(z.string(), z.unknown())
          .nullish()
          .title('Custom Fields')
          .describe('Custom field key-value pairs.'),
      }),
    },
  },
  listTickets: {
    title: 'List Tickets',
    description: 'Lists Freshdesk tickets with optional filters and pagination.',
    input: {
      schema: z.object({
        filter: z
          .string()
          .optional()
          .title('Filter')
          .describe('Predefined filter name: new_and_my_open, watching, spam, deleted.'),
        order_by: z
          .string()
          .optional()
          .title('Order By')
          .describe('Field to sort by: created_at, due_by, updated_at, status.'),
        order_type: z
          .enum(['asc', 'desc'])
          .optional()
          .title('Order Type')
          .describe('Sort direction. Defaults to desc.'),
        page: z.number().optional().title('Page').describe('Page number (default 1).'),
        per_page: z.number().optional().title('Per Page').describe('Tickets per page (max 100, default 30).'),
      }),
    },
    output: {
      schema: z.object({
        tickets: z.array(ticketSchema).title('Tickets').describe('List of matching tickets.'),
      }),
    },
  },
  updateTicket: {
    title: 'Update Ticket',
    description: 'Updates an existing Freshdesk ticket.',
    input: {
      schema: z.object({
        ticketId: z.string().title('Ticket ID').describe('The Freshdesk ticket ID to update.'),
        status: z
          .enum(['open', 'pending', 'resolved', 'closed'])
          .optional()
          .title('Status')
          .describe('Updated ticket status: "open", "pending", "resolved", or "closed".'),
        priority: z
          .enum(['low', 'medium', 'high', 'urgent'])
          .optional()
          .title('Priority')
          .describe('Updated ticket priority: "low", "medium", "high", or "urgent".'),
        responderId: z.number().optional().title('Responder ID').describe('ID of the agent to assign the ticket to.'),
        groupId: z.number().optional().title('Group ID').describe('ID of the group to assign the ticket to.'),
        custom_fields: z
          .record(z.string(), z.unknown())
          .optional()
          .title('Custom Fields')
          .describe('Custom field key-value pairs.'),
      }),
    },
    output: {
      schema: z.object({
        id: z.number().title('ID').describe('Unique Freshdesk ticket ID.'),
        status: z.enum(['open', 'pending', 'resolved', 'closed']).title('Status').describe('Updated ticket status.'),
        priority: z.enum(['low', 'medium', 'high', 'urgent']).title('Priority').describe('Updated ticket priority.'),
        updatedAt: z.string().title('Updated At').describe('ISO 8601 timestamp of last update.'),
      }),
    },
  },
  deleteTicket: {
    title: 'Delete Ticket',
    description: 'Deletes a Freshdesk ticket. Deleted tickets can be restored from the Freshdesk UI.',
    input: {
      schema: z.object({
        id: z.number().title('Ticket ID').describe('The Freshdesk ticket ID to delete.'),
      }),
    },
    output: {
      schema: z.object({}),
    },
  },
  searchTickets: {
    title: 'Search Tickets',
    description: 'Searches Freshdesk tickets by email, status, or priority.',
    input: {
      schema: z.object({
        email: z.string().optional().title('Email').describe('Filter by requester email address.'),
        status: z
          .enum(['open', 'pending', 'resolved', 'closed'])
          .optional()
          .title('Status')
          .describe('Filter by ticket status: "open", "pending", "resolved", or "closed".'),
        priority: z
          .enum(['low', 'medium', 'high', 'urgent'])
          .optional()
          .title('Priority')
          .describe('Filter by ticket priority: "low", "medium", "high", or "urgent".'),
        limit: z
          .number()
          .default(20)
          .title('Limit')
          .describe('Maximum number of tickets to return (default 20, max 100).'),
      }),
    },
    output: {
      schema: z.object({
        tickets: z
          .array(
            z.object({
              id: z.number().title('ID').describe('Unique Freshdesk ticket ID.'),
              subject: z.string().title('Subject').describe('Subject of the ticket.'),
              status: z.enum(['open', 'pending', 'resolved', 'closed']).title('Status').describe('Ticket status.'),
              priority: z.enum(['low', 'medium', 'high', 'urgent']).title('Priority').describe('Ticket priority.'),
              createdAt: z.string().title('Created At').describe('ISO 8601 timestamp of ticket creation.'),
              requesterEmail: z.string().nullish().title('Requester Email').describe('Email address of the requester.'),
            })
          )
          .title('Tickets')
          .describe('Matching tickets.'),
      }),
    },
  },
} as const satisfies IntegrationDefinitionProps['actions']
