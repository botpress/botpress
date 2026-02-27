import { z, ActionDefinition } from '@botpress/sdk'

export const companySchema = z.object({
  id: z.string().title('Company ID').describe('The ID of the company'),
  name: z.string().title('Name').describe('The name of the company'),
  domain: z.string().title('Domain').describe('The domain of the company'),
  createdAt: z.string().title('Created At').describe('Creation date of the company'),
  updatedAt: z.string().title('Updated At').describe('Last time the company was updated'),
  properties: z.record(z.string().nullable()).title('Properties').describe('The properties of the company'),
})

const searchCompany: ActionDefinition = {
  title: 'Search Company',
  description: 'Search for a company in Hubspot',
  input: {
    schema: z.object({
      name: z.string().optional().title('Name').describe('The name of the company to search for'),
      domain: z.string().optional().title('Domain').describe('The domain of the company to search for'),
    }),
  },
  output: {
    schema: z.object({
      company: companySchema.optional().title('Company').describe('The company found'),
    }),
  },
}

const getCompany: ActionDefinition = {
  title: 'Get Company',
  description: 'Get a company from Hubspot by ID',
  input: {
    schema: z.object({
      companyId: z.string().title('Company ID').describe('The ID of the company to get'),
    }),
  },
  output: {
    schema: z.object({
      company: companySchema.title('Company').describe('The fetched company'),
    }),
  },
}

const updateCompany: ActionDefinition = {
  title: 'Update Company',
  description: 'Update a company in Hubspot',
  input: {
    schema: z.object({
      companyId: z.string().title('Company ID').describe('The ID of the company to update'),
      properties: z
        .array(
          z.object({
            name: z.string().title('Property Name').describe('The name of the property (e.g., "health_status")'),
            value: z.string().title('Property Value').describe('The value of the property'),
          })
        )
        .title('Properties')
        .describe('Properties to update on the company'),
    }),
  },
  output: {
    schema: z.object({
      company: companySchema
        .extend({
          // May not be returned by API
          name: companySchema.shape.name.optional(),
          domain: companySchema.shape.domain.optional(),
        })
        .title('Company')
        .describe('The updated company'),
    }),
  },
}

export const actions = {
  searchCompany,
  getCompany,
  updateCompany,
} as const
