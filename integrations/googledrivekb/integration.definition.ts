import * as sdk from '@botpress/sdk'
import filesReadonly from './bp_modules/files-readonly'
import {
  fileSchema,
  downloadFileDataArgSchema,
  listFoldersOutputSchema,
  listFilesOutputSchema,
  readFileArgSchema,
  listItemsInputSchema,
  downloadFileDataOutputSchema,
  fileDeletedEventSchema,
  folderSchema,
  folderDeletedEventSchema,
  baseDiscriminatedFileSchema,
  fileChannelSchema,
} from './src/schemas'

// TODO: use default options
const toJSONSchemaOptions: Partial<sdk.z.transforms.JSONSchemaGenerationOptions> = {
  discriminatedUnionStrategy: 'anyOf',
  discriminator: false,
}

export default new sdk.IntegrationDefinition({
  name: 'googledrivekb',
  title: 'Google Drive (Knowledge Base)',
  description: 'Sync Google Drive files into a Botpress knowledge base using read-only access to all files.',
  version: '0.1.1',
  readme: 'hub.md',
  icon: 'icon.svg',
  attributes: {
    category: 'File Management',
    repo: 'botpress',
  },
  configuration: {
    identifier: {
      linkTemplateScript: 'linkTemplate.vrl',
    },
    schema: sdk.z.object({}),
  },
  actions: {
    listFiles: {
      title: 'List Files',
      description: 'List files in Google Drive',
      input: {
        schema: listItemsInputSchema,
      },
      output: {
        schema: listFilesOutputSchema,
      },
    },
    listFolders: {
      title: 'List folders',
      description: 'List folders in Google Drive',
      input: {
        schema: listItemsInputSchema,
      },
      output: {
        schema: listFoldersOutputSchema,
      },
    },
    readFile: {
      title: 'Read File',
      description: "Read a file's metadata in a Google Drive",
      input: {
        schema: readFileArgSchema,
      },
      output: {
        schema: fileSchema.describe('The file read from Google Drive'),
      },
    },
    downloadFileData: {
      title: 'Download file data',
      description: 'Download data from a file in Google Drive',
      input: {
        schema: downloadFileDataArgSchema,
      },
      output: {
        schema: downloadFileDataOutputSchema,
      },
    },
    syncChannels: {
      title: 'Sync Channels',
      description: 'Sync channels for file change subscriptions',
      input: {
        schema: sdk.z.object({}),
      },
      output: {
        schema: sdk.z.object({}),
      },
    },
  },
  events: {
    fileCreated: {
      title: 'File Created',
      description: 'Triggered when a file is created in Google Drive',
      schema: fileSchema,
    },
    fileDeleted: {
      title: 'File Deleted',
      description: 'Triggered when a file is deleted in Google Drive',
      schema: fileDeletedEventSchema,
    },
    folderCreated: {
      title: 'Folder Created',
      description: 'Triggered when a folder is created in Google Drive',
      schema: folderSchema,
    },
    folderDeleted: {
      title: 'Folder Deleted',
      description: 'Triggered when a folder is deleted in Google Drive',
      schema: folderDeletedEventSchema,
    },
  },
  states: {
    configuration: {
      type: 'integration',
      schema: sdk.z.object({
        refreshToken: sdk.z
          .string()
          .title('Refresh token')
          .describe('The refresh token to use to authenticate with Google. It gets exchanged for a bearer token'),
      }),
    },
    filesCache: {
      type: 'integration',
      schema: sdk.z.object({
        filesCache: sdk.z
          .record(sdk.z.string(), baseDiscriminatedFileSchema)
          .title('Files cache')
          .describe('Map of known files'),
      }),
    },
    filesChannelsCache: {
      type: 'integration',
      schema: sdk.z.object({
        filesChannelsCache: sdk.z
          .record(sdk.z.string(), fileChannelSchema)
          .title('Files change subscription channels')
          .describe('Serialized set of channels for file change subscriptions'),
      }),
    },
  },
  secrets: {
    CLIENT_ID: {
      description: 'The client ID in your Google Cloud Credentials',
    },
    CLIENT_SECRET: {
      description: 'The client secret associated with your client ID',
    },
    WEBHOOK_SECRET: {
      description: 'The secret used to sign webhook tokens. Should be a high-entropy string that only Botpress knows',
    },
  },
  __advanced: { toJSONSchemaOptions },
}).extend(filesReadonly, ({}) => ({
  entities: {},
  actions: {
    listItemsInFolder: {
      name: 'filesReadonlyListItemsInFolder',
      attributes: { ...sdk.WELL_KNOWN_ATTRIBUTES.HIDDEN_IN_STUDIO },
    },
    transferFileToBotpress: {
      name: 'filesReadonlyTransferFileToBotpress',
      attributes: { ...sdk.WELL_KNOWN_ATTRIBUTES.HIDDEN_IN_STUDIO },
    },
  },
  events: {
    fileCreated: { name: 'filesReadonlyFileCreated' },
    fileUpdated: { name: 'filesReadonlyFileUpdated' },
    fileDeleted: { name: 'filesReadonlyFileDeleted' },
    folderDeletedRecursive: { name: 'filesReadonlyFolderDeletedRecursive' },
    aggregateFileChanges: { name: 'filesReadonlyAggregateFileChanges' },
  },
}))
