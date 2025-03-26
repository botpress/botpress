import * as sdk from '@botpress/sdk'
import filesReadonly from './bp_modules/files-readonly'

export default new sdk.PluginDefinition({
  name: 'file-synchronizer',
  version: '0.3.0',
  title: 'File Synchronizer',
  description: 'Synchronize files from external services to Botpress',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration: {
    schema: sdk.z.object({
      enablePeriodicSync: sdk.z
        /*
        .union([
          sdk.z.object({
            everyNHours: sdk.z.number().describe('The interval (in hours) at which to synchronize files.'),
          }),
          sdk.z.object({
            everyNDays: sdk.z.number().describe('The interval (in days) at which to synchronize files.'),
          }),
          sdk.z.object({
            cronExpression: sdk.z
              .number()
              .describe('A cron expression to specify the schedule at which to synchronize files.'),
          }),
        ])
        */
        .object({
          everyNHours: sdk.z.number().describe('The interval (in hours) at which to synchronize files.'),
        })
        .optional()
        .describe(
          'Enable synchronisation using the provided schedule. Leave empty to disable periodic synchronization.'
        ),
      enableRealTimeSync: sdk.z
        .boolean()
        .default(true)
        .describe(
          'Enable real-time synchronization. Whever a file is created, updated, or deleted, synchronize it to Botpress immediately. This does not work with every integration.'
        ),
      includeFiles: sdk.z
        .array(
          sdk.z.object({
            pathGlobPattern: sdk.z
              .string()
              .describe(
                'A glob pattern to match against the file path. Only files that match the pattern will be synchronized. Any pattern supported by picomatch is supported.'
              ),
            maxSizeInBytes: sdk.z
              .number()
              .optional()
              .describe(
                'Filter by maximum size (in bytes). Only files smaller than the specified size will be synchronized.'
              ),
            modifiedAfter: sdk.z
              .string()
              .datetime()
              .optional()
              .describe(
                'Filter the items by modified date. Only files modified after the specified date will be synchronized.'
              ),
          })
        )
        .min(1),
      excludeFiles: sdk.z.array(
        sdk.z.object({
          pathGlobPattern: sdk.z
            .string()
            .describe(
              'A glob pattern to match against the file path. Files that match the pattern will be ignored, even if they match the includeFiles configuration.'
            ),
        })
      ),
    }),
  },
  actions: {
    syncFilesToBotpess: {
      title: 'Sync files to Botpress',
      description: 'Start synchronization of all files from the external service to Botpress',
      input: { schema: sdk.z.object({}) },
      output: {
        schema: sdk.z.object({
          status: sdk.z.enum(['queued', 'already-running', 'error']),
        }),
      },
    },
  },
  events: {
    periodicSync: {
      schema: sdk.z.object({}),
    },
  },
  recurringEvents: {
    periodicSync: {
      type: 'periodicSync',
      payload: {},
      schedule: {
        cron: '@hourly',
      },
    },
  },
  states: {
    periodicSync: {
      type: 'bot',
      schema: sdk.z.object({
        elapsedHoursSinceLastSync: sdk.z.number(),
      }),
      expiry: 172_800_000, // 2 days
    },
  },
  workflows: {
    processQueue: {
      title: 'Process file sync queue',
      description: 'Process the file sync queue and synchronize files to Botpress',
      input: {
        schema: sdk.z.object({
          jobFileId: sdk.z.string().title('Job File').describe("The ID of the job's queue file"),
        }),
      },
      output: {
        schema: sdk.z.object({}),
      },
      tags: {
        syncJobId: {
          title: 'Sync job ID',
          description: 'The unique ID of the sync job',
        },
        syncType: {
          title: 'Sync type',
          description: 'The type of sync job',
        },
        syncInitiatedAt: {
          title: 'Created at',
          description: 'The date and time when the sync job was created',
        },
      },
    },
  },
  interfaces: {
    'files-readonly': filesReadonly,
  },
})
