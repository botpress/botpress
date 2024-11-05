import { IntegrationDefinition, z } from '@botpress/sdk'
import { integrationName } from './package.json'
import {
  fileSchema,
  fileCreateArgSchema,
  fileUpdateArgSchema,
  fileUploadDataArgSchema,
  folderSchema,
} from './src/schemas'

export default new IntegrationDefinition({
  name: integrationName,
  version: '0.0.1',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    identifier: {
      linkTemplateScript: 'linkTemplate.vrl',
    },
    schema: z.object({
      driveId: z.string().min(1).describe('The ID of the Google Drive to be accessed by the bot.'),
    }), // TODO: Implement
  },
  actions: {
    listFiles: {
      // TODO: Implement listable
      title: 'List Files',
      description: 'List files in a Google Drive',
      input: {
        schema: z.object({
          nextToken: z.string().optional().describe('The token to use to get the next page of results'),
        }),
      },
      output: {
        schema: z.object({
          items: z
            .array(fileSchema)
            .describe(
              'The list of files in the Google Drive. Results may be paginated, if set, use nextToken to get additional results'
            ),
          meta: z.object({
            nextToken: z.string().optional().describe('The token to use to get the next page of results'),
          }),
        }),
      },
    },
    listFolders: {
      // TODO: Implement listable
      title: 'List folders',
      description: 'List files in a Google Drive',
      input: {
        schema: z.object({
          nextToken: z.string().optional().describe('The token to use to get the next page of results'),
        }),
      },
      output: {
        schema: z.object({
          items: z
            .array(folderSchema)
            .describe(
              'The list of folders in the Google Drive. Results may be paginated, if set, use nextToken to get additional results'
            ),
          meta: z.object({
            nextToken: z.string().optional().describe('The token to use to get the next page of results'),
          }),
        }),
      },
    },
    createFile: {
      // TODO: Implement creatable
      title: 'Create File',
      description: 'Create an empty file in a Google Drive',
      input: {
        schema: fileCreateArgSchema,
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
        schema: z.object({
          id: z.string().min(1),
        }),
      },
      output: {
        schema: fileSchema,
      },
    },
    updateFile: {
      // TODO: Implement updatable
      title: 'Update File',
      description: "Update a file's metadata in a Google Drive",
      input: {
        schema: fileUpdateArgSchema,
      },
      output: {
        schema: fileSchema,
      },
    },
    deleteFile: {
      title: 'Delete File',
      description: 'Deletes a file in a Google Drive',
      input: {
        schema: z.object({
          id: z.string().min(1),
        }),
      },
      output: {
        schema: z.object({}),
      },
    },
    uploadFileData: {
      title: 'Upload file data',
      description: 'Upload data to a file data in a Google Drive',
      input: {
        schema: fileUploadDataArgSchema,
      },
      output: {
        schema: z.object({}),
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
        filesMap: z
          .string()
          .title('Serialized map of known files')
          .describe('Serialized map of known files (keys are file IDs and values are GoogleDriveFile objects)'),
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
