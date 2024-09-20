import { z, IntegrationDefinitionProps } from '@botpress/sdk'
import { ticketSchema, userSchema } from './schemas'

const createTicket = {
  title: 'Create Ticket',
  description: 'Creates a new ticket in Zendesk',
  input: {
    schema: z.object({
      subject: z.string().describe('Subject for the ticket'),
      comment: z.string().describe('Comment for the ticket'),
      requesterName: z.string().describe('Requester name'),
      requesterEmail: z.string().describe('Requester email'),
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
    schema: z.object({
      ticket: ticketSchema,
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
    schema: z.object({ ticket: ticketSchema }),
  },
}

const closeTicket = {
  title: 'Close ticket',
  description: 'Close a ticket by its id.',
  input: {
    schema: z.object({
      ticketId: z.string().describe('ID of the ticket to close'),
      comment: z.string().optional().describe('Closing comment'),
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
    schema: z.object({ ticket: ticketSchema }),
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
    schema: z.object({
      customers: z.array(userSchema),
    }),
  },
}

const listAgents = {
  title: 'List Agents',
  description: 'List agents',
  input: {
    schema: z.object({
      isOnline: z.boolean().optional().default(true).describe('Only return agents that are currently online'),
    }),
  },
  output: {
    schema: z.object({
      agents: z.array(userSchema),
    }),
  },
}

const callApi = {
  title: 'Call API',
  description: 'Call Zendesk API',
  input: {
    schema: z.object({
      method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).describe('HTTP Method'),
      path: z.string().describe('URL Path (https://<subdomain>.zendesk.com/api/v2/PATH)'),
      headers: z.string().optional().describe('Headers (JSON)'),
      params: z.string().optional().describe('Query Params (JSON)'),
      requestBody: z.string().optional().describe('Request Body (JSON)'),
    }),
  },
  output: {
    schema: z.object({
      status: z.number(),
      headers: z.record(z.string()),
      data: z.record(z.string(), z.any()),
    }),
  },
}

const syncKb = {
  title: 'Sync Knowledge Base',
  description: 'Sync Zendesk knowledge base to bot knowledge base',
  input: {
    schema: z.object({
      knowledgeBaseId: z.string().describe('ID of the bot knowledge base you want to sync with'),
    }),
  },
  output: {
    schema: z.object({
      success: z.boolean(),
    }),
  },
}

export const actions = {
  getTicket,
  findCustomer,
  createTicket,
  closeTicket,
  listAgents,
  callApi,
  syncKb,
} satisfies IntegrationDefinitionProps['actions']
