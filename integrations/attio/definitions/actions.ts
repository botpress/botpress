import { z, type ActionDefinition } from '@botpress/sdk'

const recordIdentifierSchema = z
  .object({
    workspace_id: z.string().title('Workspace ID').describe('The Attio workspace ID'),
    object_id: z.string().title('Object ID').describe('The Attio object ID'),
    record_id: z.string().title('Record ID').describe('The Attio record ID (UUID)'),
  })
  .title('Record Identifier')

const recordSchema = z
  .object({
    id: recordIdentifierSchema,
    created_at: z.string().title('Created At').describe('RFC3339 timestamp when the record was created'),
    web_url: z.string().title('Web URL').describe('URL of the record in Attio UI'),
    values: z
      .record(z.any())
      .title('Values')
      .describe('Map of attribute slug or ID to its value (single value or array of values)'),
  })
  .title('Record')

const listRecordsInput: ActionDefinition = {
  title: 'List Records',
  description: 'List records of an Attio object with optional filters, sorts and pagination',
  input: {
    schema: z.object({
      path: z
        .object({
          object: z
            .string()
            .min(1)
            .title('Object')
            .describe("Object slug or UUID, e.g. 'people'"),
        })
        .title('Path'),
      body: z
        .object({
          filter: z
            .record(z.any())
            .optional()
            .title('Filter')
            .describe('Filtering object; see Attio filtering guide'),
          sorts: z
            .array(
              z.object({
                direction: z.enum(['asc', 'desc']).title('Direction'),
                attribute: z.string().min(1).title('Attribute'),
                field: z.string().min(1).title('Field'),
              })
            )
            .optional()
            .title('Sorts')
            .describe('Sorting instructions'),
          limit: z
            .number()
            .optional()
            .title('Limit')
            .describe('Max number of records to return (default 500)'),
          offset: z
            .number()
            .optional()
            .title('Offset')
            .describe('Number of records to skip (default 0)'),
        })
        .title('Body')
        .describe('Filtering, sorting and pagination parameters'),
    }),
  },
  output: {
    schema: z
      .object({
        data: z.array(recordSchema).title('Records').describe('List of records'),
      })
      .title('List Records Response'),
  },
}

const getRecord: ActionDefinition = {
  title: 'Get Record',
  description: 'Get a single record by object and record ID',
  input: {
    schema: z.object({
      path: z
        .object({
          object: z.string().min(1).title('Object').describe('Object slug or UUID'),
          record_id: z.string().min(1).title('Record ID').describe('Record UUID'),
        })
        .title('Path'),
    }),
  },
  output: {
    schema: z
      .object({
        data: z.array(recordSchema).title('Records').describe('The fetched record in a list'),
      })
      .title('Get Record Response'),
  },
}

const createRecord: ActionDefinition = {
  title: 'Create Record',
  description: 'Create a new record in an Attio object',
  input: {
    schema: z.object({
      path: z
        .object({
          object: z.string().min(1).title('Object').describe('Object slug or UUID'),
        })
        .title('Path'),
      body: z
        .object({
          values: z.record(z.any()).title('Values').describe('Map of attribute slug/ID to value(s)'),
        })
        .title('Body'),
    }),
  },
  output: {
    schema: z
      .object({
        data: recordSchema.title('Record').describe('The created record'),
      })
      .title('Create Record Response'),
  },
}

const updateRecord: ActionDefinition = {
  title: 'Update Record',
  description: 'Update an existing record by object and record ID',
  input: {
    schema: z.object({
      path: z
        .object({
          object: z.string().min(1).title('Object').describe('Object slug or UUID'),
          record_id: z.string().min(1).title('Record ID').describe('Record UUID'),
        })
        .title('Path'),
      body: z
        .object({
          values: z.record(z.any()).title('Values').describe('Map of attribute slug/ID to value(s) to upsert'),
        })
        .title('Body'),
    }),
  },
  output: {
    schema: z
      .object({
        data: recordSchema.title('Record').describe('The updated record'),
      })
      .title('Update Record Response'),
  },
}

export const actions = {
  listRecords: listRecordsInput,
  getRecord,
  createRecord,
  updateRecord,
} as const


