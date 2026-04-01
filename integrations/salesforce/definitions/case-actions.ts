import * as sdk from '@botpress/sdk'
import { recordResultSchema, searchOutputSchema } from './common-schemas'

const createCaseInputSchema = sdk.z.object({
  Subject: sdk.z.string().title('Subject').describe('The subject of the case'),
  Description: sdk.z.string().title('Description').describe('The description of the case'),
  Status: sdk.z.string().optional().title('Status').describe('The status of the case'),
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

const createCase = {
  title: 'Create Case',
  description: 'Create a Salesforce Case',
  input: {
    schema: createCaseInputSchema,
  },
  output: {
    schema: recordResultSchema,
  },
} satisfies sdk.ActionDefinition

const updateCase = {
  title: 'Update Case',
  description: 'Update a Salesforce Case',
  input: {
    schema: sdk.z.object({
      Id: sdk.z.string().title('ID').describe('The ID of the case'),
      ...createCaseInputSchema.partial().shape,
    }),
  },
  output: {
    schema: recordResultSchema,
  },
} satisfies sdk.ActionDefinition

const searchCases = {
  title: 'Search Cases',
  description: 'Search Salesforce Cases',
  input: {
    schema: sdk.z.object({
      Id: sdk.z.string().optional().title('ID').describe('The ID of the case'),
      Subject: sdk.z.string().optional().title('Subject').describe('The subject of the case'),
      Description: sdk.z.string().optional().title('Description').describe('The description of the case'),
      Status: sdk.z.string().optional().title('Status').describe('The status of the case'),
    }),
  },
  output: {
    schema: searchOutputSchema,
  },
} satisfies sdk.ActionDefinition

export const caseActionDefinitions = {
  createCase,
  searchCases,
  updateCase,
} satisfies sdk.IntegrationDefinitionProps['actions']
