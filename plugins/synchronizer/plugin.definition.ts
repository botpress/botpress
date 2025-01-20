import * as sdk from '@botpress/sdk'
import deletable from './bp_modules/deletable'
import listable from './bp_modules/listable'

const itemSchema = listable.definition.entities.item.schema

export default new sdk.PluginDefinition({
  name: 'synchronizer',
  version: '0.0.1',
  configuration: {
    schema: sdk.z.object({
      tableName: sdk.z.string().title('Table Name').describe('The name of the table to store items'),
    }),
  },
  actions: {
    synchronize: {
      title: 'Synchronize',
      description: 'Manually synchronize a page of items without waiting for the cron job',
      input: { schema: sdk.z.object({}) },
      output: { schema: sdk.z.object({ itemsLeft: sdk.z.boolean() }) },
    },
    clear: {
      title: 'Clear',
      description: 'Clear the table',
      input: { schema: sdk.z.object({}) },
      output: { schema: sdk.z.object({}) },
    },
  },
  states: {
    table: {
      type: 'bot',
      schema: sdk.z.object({
        tableCreated: sdk.z.boolean().optional().title('Table Created').describe('Whether the table has been created'),
      }),
    },
    job: {
      type: 'bot',
      schema: sdk.z.object({
        nextToken: sdk.z
          .string()
          .optional()
          .title('Next Token')
          .describe('The token to use to get the next page of items'),
      }),
    },
  },
  events: {
    listItems: {
      schema: sdk.z.object({}),
    },
    rowInserted: {
      schema: sdk.z.object({ row: itemSchema }),
    },
    rowUpdated: {
      schema: sdk.z.object({ row: itemSchema }),
    },
    rowDeleted: {
      schema: sdk.z.object({ row: itemSchema.pick({ id: true }) }),
    },
  },
  recurringEvents: {
    runListItem: {
      type: 'listItems',
      payload: {},
      schedule: {
        cron: '* * * * *', // every minute
      },
    },
  },
  interfaces: {
    listable,
    deletable,
  },
})
