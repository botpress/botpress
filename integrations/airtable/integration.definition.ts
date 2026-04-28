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
  version: '3.0.0',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    identifier: {
      linkTemplateScript: 'linkTemplate.vrl',
    },
    schema: z.object({}),
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
  states: {
    oAuthCredentials: {
      type: 'integration',
      schema: z.object({
        accessToken: z.string().secret().describe('The OAuth access token'),
        refreshToken: z.string().secret().describe('The rotating OAuth refresh token'),
        expiresAt: z.string().datetime().describe('The timestamp of when the access token expires'),
        scopes: z.array(z.string()).describe('The scopes granted to the token'),
      }),
    },
    manualCredentials: {
      type: 'integration',
      schema: z.object({
        personalAccessToken: z.string().secret().describe('The Airtable Personal Access Token'),
      }),
    },
    oauthPkce: {
      type: 'integration',
      schema: z.object({
        codeVerifier: z.string().describe('The PKCE code verifier paired with the in-flight authorization request'),
        createdAt: z.string().datetime().describe('The timestamp of when the code verifier was issued'),
      }),
    },
    configuration: {
      type: 'integration',
      schema: z.object({
        baseId: z.string().describe('The selected Airtable base ID'),
        endpointUrl: z.string().optional().describe('Optional override for the Airtable API endpoint'),
      }),
    },
  },
  secrets: {
    CLIENT_ID: {
      description: 'The client ID of the Airtable OAuth app.',
    },
    CLIENT_SECRET: {
      description: 'The client secret of the Airtable OAuth app.',
    },
  },
  attributes: {
    category: 'Project Management',
    repo: 'botpress',
  },
})
