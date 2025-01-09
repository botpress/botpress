import * as sdk from '@botpress/sdk'
import creatable from './bp_modules/creatable'
import deletable from './bp_modules/deletable'
import listable from './bp_modules/listable'
import readable from './bp_modules/readable'
import updatable from './bp_modules/updatable'

export default new sdk.PluginDefinition({
  name: 'synchronizer',
  version: '0.0.1',
  configuration: {
    schema: sdk.z.object({
      tableName: sdk.z.string(),
    }),
  },
  events: {
    listItems: {
      schema: sdk.z.object({ nextToken: sdk.z.string().optional() }),
    },
    rowInserted: {
      schema: sdk.z.object({
        item: creatable.definition.entities.item.schema,
      }),
    },
    rowUpdated: {
      schema: sdk.z.object({
        item: updatable.definition.entities.item.schema,
      }),
    },
    rowDeleted: {
      schema: sdk.z.object({
        item: deletable.definition.entities.item.schema,
      }),
    },
  },
  recurringEvents: {
    runListItem: {
      type: 'listItems',
      payload: {},
      schedule: {
        cron: '0 * * * *',
      },
    },
  },
  interfaces: {
    listable,
    creatable,
    readable,
    updatable,
    deletable,
  },
})
