import * as sdk from '@botpress/sdk'
import { recordResultSchema, searchOutputSchema } from './common-schemas'

export const createLeadInputSchema = sdk.z.object({
  FirstName: sdk.z.string().title('First Name').describe('The first name of the lead (e.g. John)'),
  LastName: sdk.z.string().title('Last Name').describe('The last name of the lead (e.g. Doe)'),
  Email: sdk.z.string().email().title('Email').describe('The email address of the lead'),
  Company: sdk.z.string().title('Company').describe('The company of the lead (e.g. Acme Inc.)'),
  Phone: sdk.z.string().optional().title('Phone').describe('The phone number of the lead'),
  Title: sdk.z.string().optional().title('Title').describe('The title of the lead'),
  Description: sdk.z.string().optional().title('Description').describe('The description of the lead'),
  customFields: sdk.z
    .string()
    .displayAs<any>({
      id: 'text',
      params: {
        allowDynamicVariable: true,
        growVertically: true,
        multiLine: true,
        resizable: true,
      },
    })
    .optional()
    .title('Custom Fields')
    .describe('Additional fields in JSON format'),
})

const createLead = {
  title: 'Create Lead',
  description: 'Create a Salesforce Lead',
  input: {
    schema: createLeadInputSchema,
  },
  output: {
    schema: recordResultSchema,
  },
} satisfies sdk.ActionDefinition

const updateLead = {
  title: 'Update Lead',
  description: 'Update a Salesforce Lead',
  input: {
    schema: sdk.z.object({
      Id: sdk.z.string().title('ID').describe('The ID of the lead'),
      ...createLeadInputSchema.partial().shape,
    }),
  },
  output: {
    schema: recordResultSchema,
  },
} satisfies sdk.ActionDefinition

const searchLeads = {
  title: 'Search Leads',
  description: 'Search Salesforce Leads',
  input: {
    schema: sdk.z.object({
      Id: sdk.z.string().optional().title('ID').describe('The ID of the lead (e.g., leadId1)'),
      Name: sdk.z.string().optional().title('Name').describe('The name of the lead (e.g., John Doe)'),
      Email: sdk.z
        .string()
        .email()
        .optional()
        .title('Email')
        .describe('The email address of the lead (e.g., john.doe@example.com)'),
    }),
  },
  output: {
    schema: searchOutputSchema,
  },
} satisfies sdk.ActionDefinition

export const leadActionDefinitions = {
  createLead,
  updateLead,
  searchLeads,
} satisfies sdk.IntegrationDefinitionProps['actions']
