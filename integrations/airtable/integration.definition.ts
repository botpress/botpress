/* bplint-disable */
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
  version: '0.0.4',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({
      accessToken: z.string().describe('Personal Access Token'),
      baseId: z.string().describe('Base ID'),
      endpointUrl: z
        .string()
        .optional()
        .default('https://api.airtable.com/v0/')
        .describe('API endpoint to hit (Default: https://api.airtable.com/v0/)'),
    }),
  },
  channels: {},
  user: {
    tags: {},
  },
  actions: {
    listBases: {
      title: 'List Bases',
      input: {
        schema: z.object({
          bases: z.array(
            z.object({
              id: z.string(),
              name: z.string(),
              permissionLevel: z.string(),
            })
          ),
        }),
      },
      output: {
        schema: z.object({
          bases: z
            .array(
              z.object({
                id: z.string(),
                name: z.string(),
                permissionLevel: z.string(),
              })
            )
            .title('Bases')
            .describe('Array of bases'),
        }),
      },
    },
    getTableRecords: {
      title: 'Get Records of the Table',
      input: {
        schema: getTableRecordsInputSchema,
      },
      output: {
        schema: getTableRecordsOutputSchema,
      },
    },
    listTables: {
      title: 'List Tables',
      input: {
        schema: z.object({
          tables: z.array(z.object({ id: z.string(), name: z.string(), type: z.string(), primaryFieldId: z.string() })),
        }),
      },
      output: {
        schema: z.object({}),
      },
    },
    createTable: {
      title: 'Create Table',
      input: {
        schema: createTableInputSchema,
      },
      output: {
        schema: createTableOutputSchema,
      },
    },
    updateTable: {
      title: 'Update Table',
      input: {
        schema: updateTableInputSchema,
      },
      output: {
        schema: updateTableOutputSchema,
      },
    },
    createRecord: {
      title: 'Create Record',
      input: {
        schema: createRecordInputSchema,
      },
      output: {
        schema: createRecordOutputSchema,
      },
    },
    updateRecord: {
      title: 'Update Record',
      input: {
        schema: updateRecordInputSchema,
      },
      output: {
        schema: updateRecordOutputSchema,
      },
    },
    listRecords: {
      title: 'List Records',
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
