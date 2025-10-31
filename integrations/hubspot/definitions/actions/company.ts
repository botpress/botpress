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

export const actions = {
  searchCompany,
} as const
