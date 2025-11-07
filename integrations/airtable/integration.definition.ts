import { z, IntegrationDefinition } from '@botpress/sdk'
import {
  createRecordInputSchema,
  createRecordOutputSchema,
  createTableInputSchema,
  createTableOutputSchema,
  getTableRecordsInputSchema,
  getTableRecordsOutputSchema,
  updateRecordInputSchema,
  updateRecordOutputSchema,
  updateTableInputSchema,
  updateTableOutputSchema,
  listRecordsInputSchema,
  listRecordsOutputSchema,
} from './src/misc/custom-schemas'

export default new IntegrationDefinition({
  name: 'airtable',
  title: 'Airtable',
  description:
    'Access and manage Airtable data to allow your chatbot to retrieve details, update records, and organize information.',
  version: '1.0.1',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({
      accessToken: z.string().describe('Personal Access Token').title('Personal Access Token'),
      baseId: z.string().describe('Base ID').title('Base ID'),
      endpointUrl: z
        .string()
        .optional()
        .default('https://api.airtable.com/v0/')
        .describe('API endpoint to hit (Default: https://api.airtable.com/v0/)')
        .title('Endpoint Url'),
    }),
  },
  channels: {},
  user: {
    tags: {},
  },
  actions: {
    getTableRecords: {
      title: 'Get Table Records',
      description: 'Get Records of the Table',
      input: {
        schema: getTableRecordsInputSchema,
      },
      output: {
        schema: getTableRecordsOutputSchema,
      },
    },
    createTable: {
      title: 'Create Table',
      description: 'Creates a new table and returns the schema for the newly created table.',
      input: {
        schema: createTableInputSchema,
      },
      output: {
        schema: createTableOutputSchema,
      },
    },
    updateTable: {
      title: 'Update Table',
      description: 'Updates the name, description, and/or date dependency settings of a table.',
      input: {
        schema: updateTableInputSchema,
      },
      output: {
        schema: updateTableOutputSchema,
      },
    },
    createRecord: {
      title: 'Create Record',
      description: 'Create a record',
      input: {
        schema: createRecordInputSchema,
      },
      output: {
        schema: createRecordOutputSchema,
      },
    },
    updateRecord: {
      title: 'Update Record',
      description: 'Updates a single record.',
      input: {
        schema: updateRecordInputSchema,
      },
      output: {
        schema: updateRecordOutputSchema,
      },
    },
    listRecords: {
      title: 'List Records',
      description: 'List records in a table.',
      input: {
        schema: listRecordsInputSchema,
      },
      output: {
        schema: listRecordsOutputSchema,
      },
    },
  },
  events: {},
  states: {},
})
