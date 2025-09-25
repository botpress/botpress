import { ActionDefinition, z } from '@botpress/sdk'
import { baseIdentifierSchema } from './common'

const recordSchema = z
  .object({
    id: baseIdentifierSchema,
    created_at: z.string().title('Created At').describe('RFC3339 timestamp when the record was created'),
    web_url: z.string().title('Web URL').describe('URL of the record in Attio UI'),
    values: z
      .record(z.any())
      .title('Values')
      .describe('Map of attribute slug or ID to its value (single value or array of values)'),
  })
  .title('Record')

// Objects & Attributes
const objectSchema = z
  .object({
    id: baseIdentifierSchema.optional(),
    api_slug: z.string().optional(),
    singular_noun: z.string().optional(),
    plural_noun: z.string().optional(),
    created_at: z.string().optional(),
  })
  .title('Object')

const attributeSchema = z
  .object({
    id: baseIdentifierSchema.extend({ attribute_id: z.string().optional() }).optional(),
    title: z.string().optional(),
    description: z.string().nullable().optional(),
    api_slug: z.string().optional(),
    type: z.string().optional(),
    slug: z.string().optional(),
    options: z
      .array(
        z.object({
          id: z.string().optional(),
          label: z.string().optional(),
          name: z.string().optional(),
          value: z.string().optional(),
          title: z.string().optional(),
          slug: z.string().optional(),
        })
      )
      .optional(),
  })
  .title('Attribute')

const listRecords: ActionDefinition = {
  title: 'List Records',
  description: 'List records of an Attio object with optional filters, sorts and pagination',
  input: {
    schema: z.object({
      object: z.string().min(1).title('Object').describe("Object slug or UUID, e.g. 'people'"),
      filter: z
        .array(
          z.object({
            attribute: z.string().min(1).title('Attribute'),
            value: z.string().min(1).title('Value'),
          })
        )
        .optional()
        .title('Filter')
        .describe('Filtering object. See Attio Shorthand Filtering guide'),
      sorts: z
        .array(
          z.object({
            direction: z.enum(['asc', 'desc']).title('Direction'),
            attribute: z.string().min(1).title('Attribute'),
            field: z.string().min(1).title('Field'),
          })
        )
        .optional()
        .title('Sorting')
        .describe('Sorting instructions. See Attio sorting guide'),
      limit: z.number().optional().title('Limit').describe('Max number of records to return (default 500)'),
      offset: z.number().optional().title('Offset').describe('Number of records to skip (default 0)'),
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
      object: z.string().min(1).title('Object').describe('Object slug or UUID'),
      id: baseIdentifierSchema.extend({ record_id: z.string().min(1).title('Record ID').describe('Record UUID') }),
    }),
  },
  output: {
    schema: z
      .object({
        data: z.object({
          id: baseIdentifierSchema.title('Identifier').describe('The fetched identifier'),
          web_url: z.string().title('Web URL').describe('URL of the record in Attio UI'),
          values: z.record(z.any()).title('Values').describe('Map of attribute slug/ID to value(s)'),
          created_at: z.string().title('Created At').describe('RFC3339 timestamp when the record was created'),
        }),
      })
      .title('Get Record Response'),
  },
}

const createRecord: ActionDefinition = {
  title: 'Create Record',
  description: 'Create a new record in an Attio object',
  input: {
    schema: z.object({
      object: z.string().min(1).title('Object').describe('Object slug or UUID'),
      data: z.object({
        values: z
          .array(
            z.object({
              attribute: z.string().min(1).title('Attribute'),
              value: z.string().min(1).title('Value'),
            })
          )
          .title('Values')
          .describe('Array of attribute slug/ID to value(s)'),
      }),
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
      object: z.string().min(1).title('Object').describe('Object slug or UUID'),
      id: baseIdentifierSchema.extend({ record_id: z.string().min(1).title('Record ID').describe('Record UUID') }),
      data: z.object({
        values: z
          .array(
            z.object({
              attribute: z.string().min(1).title('Attribute'),
              value: z.string().min(1).title('Value'),
            })
          )
          .title('Values')
          .describe('Array of attribute slug/ID to value(s) to upsert'),
      }),
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

const listObjects: ActionDefinition = {
  title: 'List Objects',
  description: 'List Attio objects in the workspace',
  input: { schema: z.object({}) },
  output: {
    schema: z
      .object({
        data: z.array(objectSchema).title('Objects').describe('List of objects'),
      })
      .title('List Objects Response'),
  },
}

const getObject: ActionDefinition = {
  title: 'Get Object',
  description: 'Get a single Attio object by slug or ID',
  input: {
    schema: z.object({
      object: z.string().min(1).title('Object').describe('Object slug or UUID'),
    }),
  },
  output: {
    schema: z
      .object({
        data: objectSchema.title('Object').describe('The requested object'),
      })
      .title('Get Object Response'),
  },
}

const listAttributes: ActionDefinition = {
  title: 'List Attributes',
  description: 'List attributes for a given Attio object',
  input: {
    schema: z.object({
      object: z.string().min(1).title('Object').describe('Object slug or UUID'),
    }),
  },
  output: {
    schema: z
      .object({
        data: z.array(attributeSchema).title('Attributes').describe('List of attributes'),
      })
      .title('List Attributes Response'),
  },
}

export const actions = {
  listRecords,
  getRecord,
  createRecord,
  updateRecord,
  listObjects,
  getObject,
  listAttributes,
} as const
