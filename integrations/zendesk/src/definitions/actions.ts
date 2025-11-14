import { z, IntegrationDefinitionProps } from '@botpress/sdk'
import { ticketSchema, userSchema } from './schemas'

const createTicket = {
  title: 'Create Ticket',
  description: 'Creates a new ticket in Zendesk',
  input: {
    schema: z.object({
      subject: z.string().title('Ticket Subject').describe('Subject for the ticket'),
      comment: z.string().title('Ticket Comment').describe('Comment for the ticket'),
      requesterName: z.string().title('Requester Name').describe('Requester name'),
      requesterEmail: z.string().title('Requester Email').describe('Requester email'),
    }),
  },
  output: {
    schema: z.object({
      ticket: ticketSchema.title('Ticket').describe('The created ticket object'),
    }),
  },
}

const getTicket = {
  title: 'Get ticket',
  description: 'Get Ticket by id.',
  input: {
    schema: z.object({
      ticketId: z.string().title('Ticket ID').describe('The ID of the ticket'),
    }),
  },
  output: {
    schema: z.object({ ticket: ticketSchema.title('Ticket').describe('The retrieved ticket object') }),
  },
}

const closeTicket = {
  title: 'Close ticket',
  description: 'Close a ticket by its id.',
  input: {
    schema: z.object({
      ticketId: z.string().title('Ticket ID').describe('ID of the ticket to close'),
      comment: z.string().optional().title('Closing Comment').describe('Closing comment'),
    }),
  },
  output: {
    schema: z.object({ ticket: ticketSchema.title('Ticket').describe('The closed ticket object') }),
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
        .title('Search Query')
        .describe('partial or full value of any user property, including name, email address, notes, or phone.'),
    }),
  },
  output: {
    schema: z.object({
      customers: z.array(userSchema).title('Customers').describe('Array of customer objects matching the search query'),
    }),
  },
}

const listAgents = {
  title: 'List Agents',
  description: 'List agents',
  input: {
    schema: z.object({
      isOnline: z
        .boolean()
        .optional()
        .default(true)
        .title('Is Online')
        .describe('Only return agents that are currently online'),
    }),
  },
  output: {
    schema: z.object({
      agents: z.array(userSchema).title('Agents').describe('Array of agent user objects'),
    }),
  },
}

const callApi = {
  title: 'Call API',
  description: 'Call Zendesk API',
  input: {
    schema: z.object({
      method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).title('HTTP Method').describe('HTTP Method'),
      path: z.string().title('URL Path').describe('URL Path (https://<subdomain>.zendesk.com/api/v2/PATH)'),
      headers: z.string().optional().title('Headers').describe('Headers (JSON)'),
      params: z.string().optional().title('Query Params').describe('Query Params (JSON)'),
      requestBody: z.string().optional().title('Request Body').describe('Request Body (JSON)'),
    }),
  },
  output: {
    schema: z.object({
      status: z.number().title('Status Code').describe('HTTP response status code'),
      headers: z.record(z.string()).title('Response Headers').describe('HTTP response headers as key-value pairs'),
      data: z.record(z.string(), z.any()).title('Response Data').describe('Response body data'),
    }),
  },
}

const syncKb = {
  title: 'Sync Knowledge Base',
  description: 'Sync Zendesk knowledge base to bot knowledge base',
  input: {
    schema: z.object({
      knowledgeBaseId: z
        .string()
        .title('Knowledge Base ID')
        .describe('ID of the bot knowledge base you want to sync with'),
    }),
  },
  output: {
    schema: z.object({
      success: z.boolean().title('Success').describe('Indicates whether the sync operation was successful'),
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
