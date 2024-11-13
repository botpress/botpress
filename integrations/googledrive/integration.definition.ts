import { IntegrationDefinition, z } from '@botpress/sdk'
import {
  fileSchema,
  createFileArgSchema,
  updateFileArgSchema,
  uploadFileDataArgSchema,
  downloadFileDataArgSchema,
  listFolderOutputSchema,
  listFileOutputSchema,
  readFileArgSchema,
  listItemsInputSchema,
  deleteFileArgSchema,
  downloadFileDataOutputSchema,
} from './src/schemas'

export default new IntegrationDefinition({
  name: 'googledrive',
  title: 'Google Drive',
  description: 'Access and manage your Google Drive files from your bot.',
  version: '0.0.2',
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
        schema: listFileOutputSchema,
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
        schema: listFolderOutputSchema,
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
    list: {
      type: 'integration',
      schema: z.object({
        filesMap: z.string().title('Files cache').describe('Serialized map of known files'),
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
  },
})
