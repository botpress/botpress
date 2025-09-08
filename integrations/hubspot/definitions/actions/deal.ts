import { z, ActionDefinition } from '@botpress/sdk'

const dealSchema = z
  .object({
    id: z.string().title('Deal ID').describe('The ID of the deal'),
    name: z.string().title('Name').describe('The name of the deal'),
    createdAt: z.string().title('Created At').describe('Creation date of the deal'),
    updatedAt: z.string().title('Updated At').describe('Last time the deal was updated'),
    properties: z.record(z.any()).title('Properties').describe('The properties of the deal'),
  })
  .title('Deal')
  .describe('The deal object')

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
      deal: dealSchema,
    }),
  },
}

const createDeal: ActionDefinition = {
  title: 'Create Deal',
  description: 'Create a deal in Hubspot',
  input: {
    schema: z.object({
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
      deal: dealSchema,
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
      deal: dealSchema,
    }),
  },
}

const updateDeal: ActionDefinition = {
  title: 'Update Deal',
  description: 'Update a deal in Hubspot',
  input: {
    schema: z.object({
      dealId: z.string().title('Deal ID').describe('The ID of the deal to update'),
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
      deal: dealSchema,
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
