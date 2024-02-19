import { IntegrationDefinition } from '@botpress/sdk'
import { z } from 'zod'
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
} from './src/misc/custom-schemas'
import { createRecordUi, createTableUi, getTableRecordsUi, updateRecordUi, updateTableUi } from './src/misc/custom-uis'

const INTEGRATION_NAME = 'airtable'

export default new IntegrationDefinition({
  name: INTEGRATION_NAME,
  title: 'Airtable',
  version: '0.2.0',
  readme: 'readme.md',
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
    getTableRecords: {
      title: 'Get Records of the Table',
      input: {
        schema: getTableRecordsInputSchema,
        ui: getTableRecordsUi,
      },
      output: {
        schema: getTableRecordsOutputSchema,
      },
    },
    createTable: {
      title: 'Create Table',
      input: {
        schema: createTableInputSchema,
        ui: createTableUi,
      },
      output: {
        schema: createTableOutputSchema,
      },
    },
    updateTable: {
      title: 'Update Table',
      input: {
        schema: updateTableInputSchema,
        ui: updateTableUi,
      },
      output: {
        schema: updateTableOutputSchema,
      },
    },
    createRecord: {
      title: 'Create Record',
      input: {
        schema: createRecordInputSchema,
        ui: createRecordUi,
      },
      output: {
        schema: createRecordOutputSchema,
      },
    },
    updateRecord: {
      title: 'Update Record',
      input: {
        schema: updateRecordInputSchema,
        ui: updateRecordUi,
      },
      output: {
        schema: updateRecordOutputSchema,
      },
    },
  },
  events: {},
  states: {},
})
