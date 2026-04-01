import * as sdk from '@botpress/sdk'
import { recordResultSchema, searchOutputSchema } from './common-schemas'

const createContactInputSchema = sdk.z.object({
  FirstName: sdk.z.string().title('First Name').describe('The first name of the contact (e.g. John)'),
  LastName: sdk.z.string().title('Last Name').describe('The last name of the contact (e.g. Doe)'),
  Email: sdk.z.string().email().title('Email').describe('The email address of the contact (e.g. john.doe@example.com)'),
  Phone: sdk.z.string().optional().title('Phone').describe('The phone number of the contact (Optional) (e.g. +1-555-1234)'),
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
    .describe('Custom fields (JSON)'),
})

const createContact = {
  title: 'Create Contact',
  description: 'Create a Salesforce Contact',
  input: {
    schema: createContactInputSchema,
  },
  output: {
    schema: recordResultSchema,
  },
} satisfies sdk.ActionDefinition

const updateContact = {
  title: 'Update Contact',
  description: 'Update a Salesforce Contact',
  input: {
    schema: sdk.z.object({
      Id: sdk.z.string().title('ID').describe('The ID of the contact'),
      ...createContactInputSchema.partial().shape,
    }),
  },
  output: {
    schema: recordResultSchema,
  },
} satisfies sdk.ActionDefinition

const searchContacts = {
  title: 'Search Contacts',
  description: 'Search Salesforce Contacts',
  input: {
    schema: sdk.z.object({
      Id: sdk.z.string().optional().title('ID').describe('The ID of the contact'),
      Name: sdk.z.string().optional().title('Name').describe('The first name of the contact (e.g. John)'),
      Email: sdk.z.string().email().optional().title('Email').describe('The email address of the contact (e.g. john.doe@example.com)'),
    }),
  },
  output: {
    schema: searchOutputSchema,
  },
} satisfies sdk.ActionDefinition

export const contactActionDefinitions = {
  createContact,
  searchContacts,
  updateContact,
} satisfies sdk.IntegrationDefinitionProps['actions']
