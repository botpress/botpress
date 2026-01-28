import { z, ActionDefinition } from '@botpress/sdk'

// Lead Schema: defines what a Kommo lead looks like in Botpress
export const leadSchema = z.object({
  id: z.number().describe('Lead ID'),
  name: z.string().describe('Lead name'),
  price: z.number().optional().describe('Lead value in dollars'),
  responsibleUserId: z.number().optional().describe('User responsible for this lead'),
  pipelineId: z.number().optional().describe('Which sales pipeline'),
  statusId: z.number().optional().describe('Which stage in the pipeline'),
  createdAt: z.number().describe('When created (Unix timestamp)'),
  updatedAt: z.number().describe('When last updated (Unix timestamp)'),
})

const createLead: ActionDefinition = {
  title: 'Create Lead',
  description: 'Creates a new lead in Kommo CRM',
  input: {
    schema: z.object({
      name: z.string().title('Lead name').describe('Lead name (required)'),
      price: z.number().optional().title('Lead value').describe('Lead value in dollars'),
      responsibleUserId: z.number().optional().title('Responsible User ID').describe('User ID to assign this lead to'),
      pipelineId: z.number().optional().title('Pipeline ID').describe('Pipeline ID (defaults to main pipeline)'),
      statusId: z.number().optional().title('Status ID').describe('Initial status/stage ID'),
    }),
  },
  output: {
    schema: z.object({
      lead: leadSchema.describe('The created lead'),
    }),
  },
}

const updateLead: ActionDefinition = {
  title: 'Update Lead',
  description: 'Updates an existing lead in Kommo',
  input: {
    schema: z.object({
      leadId: z.number().title('Lead ID').describe('Lead ID to update'),
      name: z.string().optional().title('New name').describe('New name'),
      price: z.number().optional().title('New price').describe('New price'),
      responsibleUserId: z.number().optional().title('New responsible user').describe('New responsible user'),
      pipelineId: z.number().optional().title('New pipeline ID').describe('New pipeline ID'),
      statusId: z.number().optional().title('New status/stage ID').describe('New status/stage ID'),
    }),
  },
  output: {
    schema: z.object({
      lead: leadSchema.describe('The updated lead'),
    }),
  },
}

const searchLeads: ActionDefinition = {
  title: 'Search Leads',
  description: 'search for leads by name or other fields',
  input: {
    schema: z.object({
      query: z.string().describe('Search query'),
    }),
  },
  output: {
    schema: z.object({
      leads: z.array(leadSchema).describe('Array of matching leads (empty if none found)'),
    }),
  },
}

// Export all lead actions
export const actions = {
  createLead,
  searchLeads,
  updateLead,
} as const
