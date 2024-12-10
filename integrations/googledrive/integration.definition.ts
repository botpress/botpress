import { IntegrationDefinition, z } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import {
  fileSchema,
  createFileArgSchema,
  updateFileArgSchema,
  uploadFileDataArgSchema,
  downloadFileDataArgSchema,
  listFoldersOutputSchema,
  listFilesOutputSchema,
  readFileArgSchema,
  listItemsInputSchema,
  deleteFileArgSchema,
  downloadFileDataOutputSchema,
  fileDeletedEventSchema,
  folderSchema,
  folderDeletedEventSchema,
  baseDiscriminatedFileSchema,
  fileChannelSchema,
} from './src/schemas'

export default new IntegrationDefinition({
  name: 'googledrive',
  title: 'Google Drive',
  description: 'Access and manage your Google Drive files from your bot.',
  version: '0.0.4',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    identifier: {
      linkTemplateScript: 'linkTemplate.vrl',
    },
    schema: z.object({}),
  },
  actions: {
    listFiles: {
      // TODO: Implement listable
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
      // TODO: Implement listable
      title: 'List folders',
      description: 'List folders in Google Drive',
      input: {
        schema: listItemsInputSchema,
      },
      output: {
        schema: listFoldersOutputSchema,
      },
    },
    createFile: {
      // TODO: Implement creatable
      title: 'Create File',
      description: 'Create an empty file in Google Drive',
      input: {
        schema: createFileArgSchema,
      },
      output: {
        schema: fileSchema.describe('The file created in Google Drive'),
      },
    },
    readFile: {
      // TODO: Implement readable
      title: 'Read File',
      description: "Read a file's metadata in a Google Drive",
      input: {
        schema: readFileArgSchema,
      },
      output: {
        schema: fileSchema.describe('The file read from Google Drive'),
      },
    },
    updateFile: {
      // TODO: Implement updatable
      title: 'Update File',
      description: "Update a file's metadata in Google Drive",
      input: {
        schema: updateFileArgSchema,
      },
      output: {
        schema: fileSchema.describe('The file updated in Google Drive'),
      },
    },
    deleteFile: {
      // TODO: Implement deletable
      title: 'Delete File',
      description: 'Deletes a file in Google Drive',
      input: {
        schema: deleteFileArgSchema,
      },
      output: {
        schema: z.object({}),
      },
    },
    uploadFileData: {
      title: 'Upload file data',
      description: 'Upload data to a file in Google Drive',
      input: {
        schema: uploadFileDataArgSchema,
      },
      output: {
        schema: z.object({}),
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
        schema: z.object({}),
      },
      output: {
        schema: z.object({}),
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
      schema: z.object({
        refreshToken: z
          .string()
          .title('Refresh token')
          .describe('The refresh token to use to authenticate with Google. It gets exchanged for a bearer token'),
      }),
    },
    filesCache: {
      type: 'integration',
      schema: z.object({
        filesCache: z
          .record(z.string(), baseDiscriminatedFileSchema)
          .title('Files cache')
          .describe('Map of known files'),
      }),
    },
    filesChannelsCache: {
      type: 'integration',
      schema: z.object({
        filesChannelsCache: z
          .record(z.string(), fileChannelSchema)
          .title('Files change subscription channels')
          .describe('Serialized set of channels for file change subscriptions'),
      }),
    },
  },
  secrets: {
    ...sentryHelpers.COMMON_SECRET_NAMES,
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
})
