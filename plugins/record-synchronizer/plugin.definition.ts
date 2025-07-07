import * as sdk from '@botpress/sdk'
import recordsReadonly from './bp_modules/records-readonly'

export default new sdk.PluginDefinition({
  name: 'record-synchronizer',
  version: '0.1.0',
  title: 'Record Synchronizer',
  description: 'Synchronize records from an external service to Botpress',
  configuration: {
    schema: sdk.z.object({}),
  },
  actions: {
    syncRecordsToBotpess: {
      title: 'Sync records to Botpress',
      description: 'Start synchronization of records from the external service to Botpress',
      input: {
        schema: sdk.z.object({
          filters: sdk.z
            .object({
              modifiedAfter: sdk.z
                .string()
                .datetime()
                .optional()
                .describe(
                  'Filter the records by modified date. Only records modified at or after the specified date will be synchronized.'
                ),
            })
            .title('Filters')
            .describe('Optional filters to apply when synchronizing records.'),
        }),
      },
      output: {
        schema: sdk.z.object({
          status: sdk.z.enum(['queued', 'already-running', 'error']),
        }),
      },
    },
  },
  workflows: {},
  interfaces: {
    'records-readonly': recordsReadonly,
  },
})
