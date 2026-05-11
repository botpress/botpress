import { IntegrationDefinitionProps, z } from '@botpress/sdk'

const ticketSchema = z.object({
  id: z.number().title('ID').describe('Unique Freshdesk ticket ID.'),
  subject: z.string().title('Subject').describe('Subject of the ticket.'),
  description: z.string().optional().title('Description').describe('HTML content of the ticket description.'),
  description_text: z.string().optional().title('Description Text').describe('Plain-text ticket description.'),
  status: z.number().title('Status').describe('Ticket status: 2=Open, 3=Pending, 4=Resolved, 5=Closed.'),
  priority: z.number().title('Priority').describe('Ticket priority: 1=Low, 2=Medium, 3=High, 4=Urgent.'),
  source: z.number().optional().title('Source').describe('Channel through which the ticket was created.'),
  email: z.string().optional().title('Email').describe('Requester email address.'),
  name: z.string().optional().title('Name').describe('Requester name.'),
  requester_id: z.number().optional().title('Requester ID').describe('Freshdesk requester user ID.'),
  responder_id: z.number().optional().title('Responder ID').describe('Agent assigned to the ticket.'),
  group_id: z.number().optional().title('Group ID').describe('Group the ticket is assigned to.'),
  type: z.string().optional().title('Type').describe('Ticket category type.'),
  tags: z.array(z.string()).optional().title('Tags').describe('Tags associated with the ticket.'),
  cc_emails: z.array(z.string()).optional().title('CC Emails').describe('List of CC email addresses.'),
  due_by: z.string().optional().title('Due By').describe('ISO 8601 timestamp for when the ticket is due.'),
  created_at: z.string().title('Created At').describe('ISO 8601 timestamp of ticket creation.'),
  updated_at: z.string().title('Updated At').describe('ISO 8601 timestamp of last update.'),
  custom_fields: z
    .record(z.string(), z.unknown())
    .optional()
    .title('Custom Fields')
    .describe('Custom field key-value pairs.'),
})

const requesterFields = z.object({
  email: z
    .string()
    .optional()
    .title('Email')
    .describe('Requester email. At least one requester field must be provided.'),
  phone: z.string().optional().title('Phone').describe('Requester phone number.'),
  twitter_id: z.string().optional().title('Twitter ID').describe('Requester Twitter handle.'),
  facebook_id: z.string().optional().title('Facebook ID').describe('Requester Facebook ID.'),
  unique_external_id: z.string().optional().title('External ID').describe('Requester external ID.'),
  requester_id: z.number().optional().title('Requester ID').describe('ID of an existing Freshdesk contact.'),
})

const ticketWriteFields = z.object({
  subject: z.string().title('Subject').describe('Subject of the ticket.'),
  description: z.string().optional().title('Description').describe('HTML content of the ticket description.'),
  priority: z.number().optional().title('Priority').describe('Ticket priority: 1=Low, 2=Medium, 3=High, 4=Urgent.'),
  status: z.number().optional().title('Status').describe('Ticket status: 2=Open, 3=Pending, 4=Resolved, 5=Closed.'),
  type: z.string().optional().title('Type').describe('Ticket category type.'),
  tags: z.array(z.string()).optional().title('Tags').describe('Tags to associate with the ticket.'),
  group_id: z.number().optional().title('Group ID').describe('ID of the group to assign the ticket to.'),
  responder_id: z.number().optional().title('Responder ID').describe('ID of the agent to assign the ticket to.'),
  cc_emails: z.array(z.string()).optional().title('CC Emails').describe('Email addresses to CC on the ticket.'),
  custom_fields: z
    .record(z.string(), z.unknown())
    .optional()
    .title('Custom Fields')
    .describe('Custom field key-value pairs.'),
})

export const actions = {
  createTicket: {
    title: 'Create Ticket',
    description:
      'Creates a new ticket in Freshdesk. At least one requester field (email, phone, twitter_id, facebook_id, unique_external_id, or requester_id) must be provided.',
    input: {
      schema: ticketWriteFields.merge(requesterFields),
    },
    output: {
      schema: z.object({
        ticket: ticketSchema.title('Ticket').describe('The created ticket.'),
      }),
    },
  },
  getTicket: {
    title: 'Get Ticket',
    description: 'Retrieves a single Freshdesk ticket by ID.',
    input: {
      schema: z.object({
        id: z.number().title('Ticket ID').describe('The Freshdesk ticket ID.'),
        include: z
          .string()
          .optional()
          .title('Include')
          .describe('Comma-separated embeds: conversations, requester, company, stats.'),
      }),
    },
    output: {
      schema: z.object({
        ticket: ticketSchema.title('Ticket').describe('The retrieved ticket.'),
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
      schema: ticketWriteFields
        .merge(requesterFields)
        .extend({ subject: z.string().optional().title('Subject').describe('Updated ticket subject.') })
        .extend({ id: z.number().title('Ticket ID').describe('The Freshdesk ticket ID to update.') }),
    },
    output: {
      schema: z.object({
        ticket: ticketSchema.title('Ticket').describe('The updated ticket.'),
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
    description:
      'Searches Freshdesk tickets using query syntax. Example: "priority:3 AND status:2". Supports up to 10 pages of results.',
    input: {
      schema: z.object({
        query: z
          .string()
          .title('Query')
          .describe('Freshdesk search query. Examples: "priority:3", "status:2 AND tag:\'billing\'", "agent_id:null".'),
        page: z.number().optional().title('Page').describe('Page number (1–10).'),
      }),
    },
    output: {
      schema: z.object({
        tickets: z.array(ticketSchema).title('Tickets').describe('Matching tickets.'),
        total: z.number().optional().title('Total').describe('Total number of matching tickets.'),
      }),
    },
  },
} as const satisfies IntegrationDefinitionProps['actions']
