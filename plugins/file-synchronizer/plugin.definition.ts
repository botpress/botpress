import * as sdk from '@botpress/sdk'
import filesReadonly from './bp_modules/files-readonly'

export default new sdk.PluginDefinition({
  name: 'file-synchronizer',
  version: '0.1.0',
  title: 'File Synchronizer',
  description: 'Synchronize files from external services to Botpress',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration: {
    schema: sdk.z.object({
      enablePeriodicSync: sdk.z
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
            fileType: sdk.z
              .enum(['document', 'image', 'audio', 'video'])
              .optional()
              .describe('Filter by file type. Only files of the specified type will be synchronized.'),
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
      output: { schema: sdk.z.object({}) },
    },
  },
  events: {
    scheduledSync: {
      schema: sdk.z.object({
        syncId: sdk.z.string().uuid().describe('Unique ID of the sync operation'),
        syncType: sdk.z.enum(['real-time', 'periodic', 'manual']).describe('The type of synchronization'),
        syncInitiatedAt: sdk.z.string().datetime().describe('The date and time the synchronization was initiated'),
        itemToSync: sdk.z
          .union([
            filesReadonly.definition.entities.file.schema.extend({
              path: sdk.z.string().describe('The full path of the file. This is only used for glob pattern matching.'),
            }),
            filesReadonly.definition.entities.folder.schema.extend({
              path: sdk.z
                .string()
                .describe('The full path of the folder. This is only used for glob pattern matching.'),
            }),
          ])
          .optional()
          .describe('If omitted, all files and folders will be synchronized'),
        syncRecursively: sdk.z.boolean().describe('Whether to synchronize the folder recursively'),
        nextToken: sdk.z.string().optional().describe('The token to get the next page of items'),
      }),
    },
  },
  states: {
    fileSync: {
      type: 'bot',
      schema: sdk.z.object({
        lock: sdk.z
          .object({
            syncId: sdk.z.string().uuid().describe('Unique ID of the sync operation'),
            syncInitiatedAt: sdk.z.string().datetime(),
            syncType: sdk.z.enum(['real-time', 'periodic', 'manual']),
          })
          .optional(),
      }),
    },
  },
  interfaces: {
    'files-readonly': filesReadonly,
  },
})
