/* bplint-disable */
import * as sdk from '@botpress/sdk'

const NEXT_TOKEN = sdk.z.string().optional().describe('The token to get the next page of records.')

export default new sdk.InterfaceDefinition({
  name: 'records-readonly',
  version: '0.1.0',
  entities: {
    record: {
      title: 'Record',
      description: 'A structured piece of data that can be enumerated and retrieved.',
      schema: sdk.z.object({
        id: sdk.z.string().describe('The unique identifier of the record. Could be a UUID or any other unique string.'),
        lastModifiedDate: sdk.z
          .string()
          .datetime()
          .optional()
          .describe('The last modified date of the record, if available'),
        revision: sdk.z.string().optional().describe('The revision number or version of the record, if available'),
      }),
    },
  },
  actions: {
    enumerateRecords: {
      attributes: {
        ...sdk.WELL_KNOWN_ATTRIBUTES.HIDDEN_IN_STUDIO,
      },
      title: 'List records',
      description: 'List all records',
      input: {
        schema: () =>
          sdk.z.object({
            nextToken: NEXT_TOKEN.describe(
              'The token to get the next page of records. Leave empty to get the first page.'
            ),
          }),
      },
      output: {
        schema: (entities) =>
          sdk.z.object({
            results: sdk.z
              .array(
                sdk.z
                  .union([
                    sdk.z.object({
                      type: sdk.z.literal('record'),
                      record: entities.record.describe('The actual record'),
                    }),
                    sdk.z.object({
                      type: sdk.z.literal('id'),
                      id: sdk.z.string().describe('The ID of the record'),
                    }),
                  ])
                  .describe(
                    'Either a full record or just its ID. If an ID is provided, the record will be fetched later.'
                  )
              )
              .describe('The records retrieved from the external service'),
            meta: sdk.z.object({
              nextToken: NEXT_TOKEN,
            }),
          }),
      },
    },
    fetchRecord: {
      attributes: {
        ...sdk.WELL_KNOWN_ATTRIBUTES.HIDDEN_IN_STUDIO,
      },
      title: 'Fetch record',
      description: 'Fetch a record by its ID',
      input: {
        schema: () =>
          sdk.z.object({
            id: sdk.z.string().describe('The ID of the record to fetch.'),
          }),
      },
      output: {
        schema: (entities) =>
          sdk.z.object({
            record: entities.record.describe('The record'),
          }),
      },
    },
  },
  events: {
    recordCreated: {
      schema: (entities) =>
        sdk.z.object({
          record: entities.record.describe('The created record'),
        }),
    },
    recordUpdated: {
      schema: (entities) =>
        sdk.z.object({
          record: entities.record.describe('The updated record'),
        }),
    },
    recordDeleted: {
      schema: (entities) =>
        sdk.z.object({
          record: entities.record.describe('The deleted record'),
        }),
    },
    aggregateRecordChanges: {
      schema: (entities) =>
        sdk.z.object({
          modifiedRecords: sdk.z
            .object({
              created: sdk.z.array(entities.record).describe('The records created'),
              updated: sdk.z.array(entities.record).describe('The records updated'),
              deleted: sdk.z.array(entities.record).describe('The records deleted'),
            })
            .describe('The modified records'),
        }),
    },
  },
})
