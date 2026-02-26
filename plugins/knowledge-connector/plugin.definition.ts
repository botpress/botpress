import * as sdk from '@botpress/sdk'
import filesReadonly from './bp_modules/files-readonly'

export default new sdk.PluginDefinition({
  name: 'knowledge-connector',
  version: '1.0.0',
  title: 'Knowledge Connector',
  description: 'Synchronize files from external services to Botpress',
  icon: 'icon.svg',
  readme: 'hub.md',
  attributes: {
    // This plugin should be invisible to users:
    ...sdk.WELL_KNOWN_ATTRIBUTES.HIDDEN_IN_STUDIO,
  },
  configuration: {
    schema: sdk.z.object({
      scheduledSyncIntervalHours: sdk.z
        .number()
        .default(0)
        .title('Scheduled Sync Interval (hours)')
        .describe(
          'The interval in hours between scheduled re-syncs. Set to 0 to disable. The plugin checks every hour and triggers a sync if enough time has elapsed since the last one.'
        ),
    }),
  },
  events: {
    scheduledSync: {
      schema: sdk.z.object({}),
    },
  },
  recurringEvents: {
    triggerScheduledSync: {
      type: 'scheduledSync',
      payload: {},
      schedule: {
        cron: '* * * * *', // every minute (for testing); handler checks actual interval from configuration
      },
    },
  },
  states: {
    folderSyncSettings: {
      type: 'bot',
      schema: sdk.z.object({
        settings: sdk.z.record(
          sdk.z.string(),
          sdk.z.record(
            sdk.z.string(),
            sdk.z.object({
              syncNewFiles: sdk.z
                .boolean()
                .default(false)
                .title('Sync New Files')
                .describe(
                  'When enabled, automatically sync new files added to this folder to Botpress. Files will be synchronized in real-time as they are added to the folder. Real-time sync is considered enabled if at least one folder has syncNewFiles set to true.'
                ),
              path: sdk.z
                .string()
                .optional()
                .title('Folder Path')
                .describe(
                  'The absolute path of the folder in the integration tree structure. Used to identify and locate the folder for synchronization.'
                ),
              integrationInstanceAlias: sdk.z
                .string()
                .optional()
                .title('Integration Instance Alias')
                .describe('The alias of the integration instance (e.g. "dropbox") used for this folder sync.'),
              integrationDefinitionName: sdk.z
                .string()
                .optional()
                .title('Integration Definition Name')
                .describe('The name of the integration definition (e.g. "dropbox") used for this folder sync.'),
              transferFileToBotpressAlias: sdk.z
                .string()
                .optional()
                .title('Transfer File Action Alias')
                .describe('The alias of the transferFileToBotpress action for this integration.'),
            })
          )
        ),
      }),
    },
    lastScheduledSync: {
      type: 'bot',
      schema: sdk.z.object({
        lastSyncAt: sdk.z
          .string()
          .optional()
          .title('Last Sync At')
          .describe('ISO timestamp of the last scheduled sync execution.'),
      }),
    },
  },
  actions: {
    listSynchronizationOperations: {
      title: 'List current synchronization operations',
      description: 'Get the list of ongoing synchronization operations',
      input: {
        schema: sdk.z.object({}),
      },
      output: {
        schema: sdk.z.object({
          isBusy: sdk.z
            .boolean()
            .title('Is Busy')
            .describe('Indicates whether at least one synchronization operation is in progress'),
          synchronizationsOperations: sdk.z
            .array(
              sdk.z
                .object({
                  integrationInstanceAlias: sdk.z
                    .string()
                    .title('Integration Instance Alias')
                    .describe('The alias of the integration instance being used for synchronization'),
                  startedAt: sdk.z
                    .string()
                    .title('Started At')
                    .describe('The timestamp when the synchronization process started'),
                  syncJobId: sdk.z.string().title('Sync Job ID').describe('The unique ID of the synchronization job'),
                })
                .title('Synchronization Status')
                .describe('Details about the individual synchronization operation')
            )
            .title('Synchronizations In Progress')
            .describe('List of ongoing synchronization operations'),
        }),
      },
    },
    checkSynchronizationStatus: {
      title: 'Check synchronization progress',
      description: 'Get the current status of a synchronization operation',
      input: {
        schema: sdk.z.object({
          syncJobId: sdk.z.string().title('Sync Job ID').describe('The unique ID of the synchronization job to check'),
        }),
      },
      output: {
        schema: sdk.z.object({
          currentStatus: sdk.z
            .enum(['inProgress', 'completed', 'failed'])
            .title('Current Status')
            .describe('The current status of the synchronization operation'),
          failureReason: sdk.z
            .string()
            .optional()
            .title('Failure Reason')
            .describe('The reason for the failure, if the synchronization has failed'),
          integrationInstanceAlias: sdk.z
            .string()
            .title('Integration Instance Alias')
            .describe('The alias of the integration instance being used for synchronization'),
          startedAt: sdk.z
            .string()
            .title('Started At')
            .describe('The timestamp when the synchronization process started'),
          endedAt: sdk.z
            .string()
            .optional()
            .title('Ended At')
            .describe(
              'The timestamp when the synchronization process ended. Present only if the sync is completed or failed.'
            ),
          totalFiles: sdk.z.number().title('Total Files').describe('The total number of files to synchronize'),
          processedFiles: sdk.z
            .number()
            .title('Processed Files')
            .describe('The number of files that have been processed so far'),
          skippedFiles: sdk.z
            .number()
            .title('Skipped Files')
            .describe('The number of files that were skipped during synchronization'),
          failedFiles: sdk.z.number().title('Failed Files').describe('The number of files that failed to synchronize'),
        }),
      },
    },
    syncFilesToBotpress: {
      title: 'Sync files to Botpress',
      description: 'Start synchronization of files from the external service to Botpress',
      input: {
        schema: sdk.z.object({
          includeFiles: sdk.z
            .array(
              sdk.z.object({
                id: sdk.z.string().title('File ID').describe('The unique identifier of the file to include.'),
                name: sdk.z.string().title('File Name').describe('The name of the file to include.'),
                absolutePath: sdk.z
                  .string()
                  .placeholder('Example: /path/to/file')
                  .describe('The absolute path of the file to include.'),
                sizeInBytes: sdk.z
                  .number()
                  .title('Size in Bytes')
                  .describe('The size of the file in bytes.')
                  .optional(),
              })
            )
            .title('Files to include')
            .describe('Files to include during synchronization.'),
          addToKbId: sdk.z
            .string()
            .placeholder('Example: kb-2f0a7ea639')
            .optional()
            .title('Knowledge Base ID')
            .describe(
              'The ID of the knowledge base to add the files to. Note that files added to knowledge bases will count towards both the Vector DB Storage quota and the File Storage quota of the workspace.'
            ),
          integrationInstanceAlias: sdk.z
            .string()
            .title('files-readonly Integration Alias')
            .describe(
              'The alias of the integration to use for synchronization. Must implement the files-readonly interface.'
            ),
          integrationDefinitionName: sdk.z
            .string()
            .title('files-readonly Integration Definition Name')
            .describe(
              'The name of the integration to use for synchronization. Must implement the files-readonly interface.'
            ),
          transferFileToBotpressAlias: sdk.z
            .string()
            .title('Integration Interface Action Alias')
            .describe(
              'The alias of the transferFileToBotpress of the files-readonly interface within the integration.'
            ),
        }),
      },
      output: {
        schema: sdk.z.object({
          syncJobId: sdk.z.string().title('Sync Job ID').describe('The unique ID of the new sync job.'),
        }),
      },
    },
  },
  interfaces: {
    'files-readonly': sdk.version.allWithinMajorOf(filesReadonly),
  },
  workflows: {
    processQueue: {
      title: 'Process file sync queue',
      description: 'Process the file sync queue and synchronize files to Botpress',
      input: {
        schema: sdk.z.object({
          jobFileId: sdk.z.string().title('Job File').describe("The ID of the job's queue file"),
          transferFileToBotpressAlias: sdk.z
            .string()
            .title('Transfer File to Botpress Action Alias')
            .describe('The alias of the action used to transfer files to Botpress'),
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
        syncInitiatedAt: {
          title: 'Created at',
          description: 'The date and time when the sync job was created',
        },
        integrationDefinitionName: {
          title: 'Integration Definition Name',
          description: 'The name of the integration used for synchronization',
        },
        integrationInstanceAlias: {
          title: 'Integration Instance Alias',
          description: 'The alias of the integration instance used for synchronization',
        },
      },
    },
  },
})
