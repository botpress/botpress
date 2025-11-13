import { z, IntegrationDefinition } from '@botpress/sdk'
import { leadSchema, leadPayloadSchema, searchLeadsPayloadSchema } from './definitions/schemas'

export default new IntegrationDefinition({
  name: 'hunter',
  version: '1.0.0',
  title: 'Hunter.io',
  description: 'Manage leads in Hunter.io',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({
      apiKey: z.string().min(1, 'API Key is required').title('API Key').describe('Your Hunter.io API Key'),
    }),
  },
  actions: {
    getLeads: {
      title: 'Get Leads',
      description: 'Fetch leads from Hunter.io',
      input: {
        schema: z.object({
          search: searchLeadsPayloadSchema.title('Search filters').describe('Filters to search leads in Hunter.io'),
        }),
      },
      output: {
        schema: z.object({
          leads: z.array(leadSchema).title('Leads List').describe('List of leads retrieved from Hunter.io'),
        }),
      },
    },
    retrieveLead: {
      title: 'Retrieve Lead',
      description: 'Retrieve a specific lead by ID from Hunter.io',
      input: {
        schema: z.object({
          id: z.number().title('Lead ID').describe('The ID of the lead to retrieve'),
        }),
      },
      output: {
        schema: z.object({
          lead: leadSchema,
        }),
      },
    },
    createLead: {
      title: 'Create Lead',
      description: 'Create a new lead in Hunter.io',
      input: {
        schema: z.object({
          lead: leadPayloadSchema,
        }),
      },
      output: {
        schema: z.object({
          lead: leadSchema,
        }),
      },
    },
    createOrUpdateLead: {
      title: 'Create or update Lead',
      description: 'Create or update a lead in Hunter.io',
      input: {
        schema: z.object({
          lead: leadPayloadSchema,
        }),
      },
      output: {
        schema: z.object({
          lead: leadSchema,
        }),
      },
    },
    updateLead: {
      title: 'Update Lead',
      description: 'Update an existing lead in Hunter.io',
      input: {
        schema: z.object({
          id: z.number().title('Lead ID').describe('The ID of the lead to update'),
          lead: leadPayloadSchema.partial({ email: true }),
        }),
      },
      output: {
        schema: z.object({}),
      },
    },
    deleteLead: {
      title: 'Delete Lead',
      description: 'Delete a lead from Hunter.io',
      input: {
        schema: z.object({
          id: z.number().title('Lead ID').describe('The ID of the lead to delete'),
        }),
      },
      output: {
        schema: z.object({}),
      },
    },
  },
})
