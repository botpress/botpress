import * as sdk from '@botpress/sdk'
import filesReadonly from './bp_modules/files-readonly'

const FILE_FILTER_PROPS = sdk.z.object({
  includeFiles: sdk.z.array(
    sdk.z
      .object({
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
        applyOptionsToMatchedFiles: sdk.z
          .object({
            addToKbId: sdk.z
              .string()
              .optional()
              .title('Knowledge Base ID')
              .describe(
                'The ID of the knowledge base to add the file to. Note that files added to knowledge bases will count towards both the Vector DB Storage quota and the File Storage quota of the workspace.'
              ),
          })
          .optional()
          .title('Apply to Matched Files')
          .describe('Options to apply to the matched files.'),
      })
      .title('Include Criteria')
      .describe('A file must match all criteria to be synchronized.')
  ),
  excludeFiles: sdk.z.array(
    sdk.z
      .object({
        pathGlobPattern: sdk.z
          .string()
          .describe(
            'A glob pattern to match against the file path. Files that match the pattern will be ignored, even if they match the includeFiles configuration.'
          ),
      })
      .title('Exclude Criteria')
      .describe('A file must match all exclude criteria to be ignored.')
  ),
})

export default new sdk.PluginDefinition({
  name: 'file-synchronizer',
  version: '0.7.1',
  title: 'File Synchronizer',
  description: 'Synchronize files from external services to Botpress',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration: {
    schema: sdk.z.object({
      enableRealTimeSync: sdk.z
        .boolean()
        .default(true)
        .describe(
          'Enable real-time synchronization. Whever a file is created, updated, or deleted, synchronize it to Botpress immediately. This does not work with every integration.'
        ),
      includeFiles: FILE_FILTER_PROPS.shape.includeFiles
        .title('Include Rules')
        .describe('A list of rules to include files. Only files that match one or more rules will be synchronized.'),
      excludeFiles: FILE_FILTER_PROPS.shape.excludeFiles
        .title('Exclude Rules')
        .describe(
          'A list of rules to exclude files. Files that match one or more rules will be ignored. This takes precedence over Include Rules.'
        ),
    }),
  },
  actions: {
    syncFilesToBotpess: {
      title: 'Sync files to Botpress',
      description: 'Start synchronization of files from the external service to Botpress',
      input: {
        schema: sdk.z.object({
          includeFiles: FILE_FILTER_PROPS.shape.includeFiles
            .title('Include Rules Override')
            .describe('If omitted, the global Include Rules will be used.')
            .optional(),
          excludeFiles: FILE_FILTER_PROPS.shape.excludeFiles
            .title('Exclude Rules Override')
            .describe('If omitted, the global Exclude Rules will be used')
            .optional(),
        }),
      },
      output: {
        schema: sdk.z.object({
          status: sdk.z.enum(['queued', 'already-running', 'error']),
        }),
      },
    },
    listItemsInFolder: {
      // Re-export the action from the files-readonly interface:
      ...filesReadonly.definition.actions.listItemsInFolder,
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
