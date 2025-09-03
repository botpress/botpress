import { z, ActionDefinition } from '@botpress/sdk'

const leadSchema = z
  .object({
    id: z.string().title('Lead ID').describe('The ID of the lead'),
    name: z.string().title('Name').describe('The name of the lead'),
    createdAt: z.string().title('Created At').describe('Creation date of the lead'),
    updatedAt: z.string().title('Updated At').describe('Last time the lead was updated'),
    properties: z.record(z.any()).title('Properties').describe('The properties of the lead'),
  })
  .title('Lead')
  .describe('The lead object')

const searchLead: ActionDefinition = {
  title: 'Search Lead',
  description: 'Search for a lead in Hubspot',
  input: {
    schema: z.object({
      name: z.string().optional().title('Name').describe('The name of the lead to search for'),
    }),
  },
  output: {
    schema: z.object({
      lead: leadSchema,
    }),
  },
}
const createLead: ActionDefinition = {
  title: 'Create Lead',
  description: 'Create a lead in Hubspot',
  input: {
    schema: z.object({
      contact: z
        .string()
        .optional()
        .title('Contact')
        .describe('The contact to associate the lead with. Can be an email address or contact ID'),
      properties: z
        .array(
          z.object({
            name: z.string().title('Property Name').describe('The name of the property'),
            value: z.string().title('Property Value').describe('The value of the property'),
          })
        )
        .optional()
        .title('Properties')
        .describe('The properties of the lead'),
    }),
  },
  output: {
    schema: z.object({
      lead: leadSchema,
    }),
  },
}

const getLead: ActionDefinition = {
  title: 'Get Lead',
  description: 'Get a lead from Hubspot',
  input: {
    schema: z.object({
      leadId: z.string().title('Lead ID').describe('The ID of the lead to get'),
    }),
  },
  output: {
    schema: z.object({
      lead: leadSchema,
    }),
  },
}

const updateLead: ActionDefinition = {
  title: 'Update Lead',
  description: 'Update a lead in Hubspot',
  input: {
    schema: z.object({
      leadId: z.string().title('Lead ID').describe('The ID of the lead to update'),
      properties: z
        .array(
          z.object({
            name: z.string().title('Property Name').describe('The name of the property'),
            value: z.string().title('Property Value').describe('The value of the property'),
          })
        )
        .optional()
        .title('Properties')
        .describe('The properties of the lead'),
    }),
  },
  output: {
    schema: z.object({
      lead: leadSchema,
    }),
  },
}

const deleteLead: ActionDefinition = {
  title: 'Delete Lead',
  description: 'Delete a lead in Hubspot',
  input: {
    schema: z.object({
      leadId: z.string().title('Lead ID').describe('The ID of the lead to delete'),
    }),
  },
  output: {
    schema: z.object({}).title('Empty').describe('Empty output'),
  },
}

export const actions = {
  searchLead,
  createLead,
  getLead,
  updateLead,
  deleteLead,
} as const
