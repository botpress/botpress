import { z, ActionDefinition } from '@botpress/sdk'

export const dealSchema = z.object({
  id: z.string().title('Deal ID').describe('The ID of the deal'),
  name: z.string().title('Name').describe('The name of the deal'),
  createdAt: z.string().title('Created At').describe('Creation date of the deal'),
  updatedAt: z.string().title('Updated At').describe('Last time the deal was updated'),
  properties: z.record(z.string().nullable()).title('Properties').describe('The properties of the deal'),
})

const searchDeal: ActionDefinition = {
  title: 'Search Deal',
  description: 'Search for a deal in Hubspot',
  input: {
    schema: z.object({
      name: z.string().optional().title('Name').describe('The name of the deal to search for'),
    }),
  },
  output: {
    schema: z.object({
      deal: dealSchema.optional().title('Deal').describe('The deal found, or undefined if not found'),
    }),
  },
}

const createDeal: ActionDefinition = {
  title: 'Create Deal',
  description: 'Create a deal in Hubspot',
  input: {
    schema: z.object({
      name: z.string().title('Name').describe('The name of the deal'),
      properties: z
        .array(
          z.object({
            name: z.string().title('Property Name').describe('The name of the property'),
            value: z.string().title('Property Value').describe('The value of the property'),
          })
        )
        .optional()
        .title('Properties')
        .describe('The properties of the deal'),
    }),
  },
  output: {
    schema: z.object({
      deal: dealSchema.title('Deal').describe('The created deal'),
    }),
  },
}

const getDeal: ActionDefinition = {
  title: 'Get Deal',
  description: 'Get a deal from Hubspot',
  input: {
    schema: z.object({
      dealId: z.string().title('Deal ID').describe('The ID of the deal to get'),
    }),
  },
  output: {
    schema: z.object({
      deal: dealSchema.title('Deal').describe('The fetched deal'),
    }),
  },
}

const updateDeal: ActionDefinition = {
  title: 'Update Deal',
  description: 'Update a deal in Hubspot',
  input: {
    schema: z.object({
      dealId: z.string().title('Deal ID').describe('The ID of the deal to update'),
      name: z.string().optional().title('Name').describe('The name of the deal'),
      properties: z
        .array(
          z.object({
            name: z.string().title('Property Name').describe('The name of the property'),
            value: z.string().title('Property Value').describe('The value of the property'),
          })
        )
        .optional()
        .title('Properties')
        .describe('The properties of the deal'),
    }),
  },
  output: {
    schema: z.object({
      deal: dealSchema
        .extend({
          // May not be returned by API
          name: dealSchema.shape.name.optional(),
        })
        .title('Deal')
        .describe('The updated deal'),
    }),
  },
}

const deleteDeal: ActionDefinition = {
  title: 'Delete Deal',
  description: 'Delete a deal in Hubspot',
  input: {
    schema: z.object({
      dealId: z.string().title('Deal ID').describe('The ID of the deal to delete'),
    }),
  },
  output: {
    schema: z.object({}).title('Empty').describe('Empty output'),
  },
}

export const actions = {
  searchDeal,
  createDeal,
  getDeal,
  updateDeal,
  deleteDeal,
} as const
