/* bplint-disable */
import { z, InterfaceDefinition } from '@botpress/sdk'

const BASE_ITEM = (itemType: 'file' | 'folder' | 'item' = 'item') =>
  z.object({
    id: z
      .string()
      .describe(
        `The ${itemType}'s ID. This could be a unique identifier from the external service, or a relative or absolute path, so long as it's unique.`
      ),
    type: z.union([z.literal('file'), z.literal('folder')]).describe('The entity type'),
    name: z
      .string()
      .describe(
        `The ${itemType}'s name. This will be displayed in the Botpress UI and be used as the ${itemType}'s name on Files API."`
      ),
    parentId: z
      .string()
      .optional()
      .describe(`The parent folder ID. Leave empty if the ${itemType} is in the root folder.`),
    absolutePath: z.string().optional().describe(`The absolute path of the ${itemType}. Leave empty if not available.`),
  })

const FOLDER = BASE_ITEM('folder').extend({
  type: z.literal('folder'),
})

const FILE = BASE_ITEM('file').extend({
  type: z.literal('file'),
  sizeInBytes: z.number().optional().describe('The file size in bytes, if available'),
  lastModifiedDate: z.string().datetime().optional().describe('The last modified date of the file, if available'),
  contentHash: z.string().optional().describe('The hash of the file content, or version/revision number, if available'),
})

const FILE_WITH_PATH = FILE.extend({
  absolutePath: z.string().describe('The full path of the file'),
})

const FOLDER_WITH_PATH = FOLDER.extend({
  absolutePath: z.string().describe('The full path of the folder'),
})

const NEXT_TOKEN = z.string().optional().describe('The token to get the next page of items.')

export default new InterfaceDefinition({
  name: 'files-readonly',
  version: '0.2.0',
  actions: {
    listItemsInFolder: {
      title: 'List items in folder',
      description: 'List the files and folders in a folder',
      input: {
        schema: () =>
          z.object({
            folderId: FOLDER.shape.id
              .optional()
              .describe('The folder ID to list the items from. Leave empty to list items from the root folder.'),
            filters: z
              .object({
                itemType: BASE_ITEM().shape.type.optional().describe('Filter the items by type'),
                maxSizeInBytes: FILE.shape.sizeInBytes
                  .optional()
                  .describe('Filter the items by maximum size (in bytes)'),
                modifiedAfter: FILE.shape.lastModifiedDate
                  .optional()
                  .describe('Filter the items modified after the given date'),
              })
              .optional()
              .describe('Optional search filters'),
            nextToken: NEXT_TOKEN.describe(
              'The token to get the next page of items. Leave empty to get the first page.'
            ),
          }),
      },
      output: {
        schema: () =>
          z.object({
            items: z.array(z.union([FILE, FOLDER])).describe('The files and folders in the folder'),
            meta: z.object({
              nextToken: NEXT_TOKEN,
            }),
          }),
      },
    },
    transferFileToBotpress: {
      title: 'Transfer file to Botpress',
      description: 'Transfer a file from an external service to Botpress',
      input: {
        schema: () =>
          z.object({
            file: FILE.title('File to transfer').describe('The file to transfer'),
            fileKey: z.string().title('File key').describe('The file key to use in Botpress'),
          }),
      },
      output: {
        schema: () =>
          z.object({
            botpressFileId: z.string().describe('The file ID of the uploaded file on Botpress'),
          }),
      },
    },
  },
  events: {
    fileCreated: {
      schema: () =>
        z.object({
          file: FILE_WITH_PATH.describe('The created file'),
        }),
    },
    fileUpdated: {
      schema: () =>
        z.object({
          file: FILE_WITH_PATH.describe('The updated file'),
        }),
    },
    fileDeleted: {
      schema: () =>
        z.object({
          file: FILE_WITH_PATH.describe('The deleted file'),
        }),
    },
    folderDeletedRecursive: {
      schema: () =>
        z.object({
          folder: FOLDER_WITH_PATH.describe('The deleted folder'),
        }),
    },
    aggregateFileChanges: {
      schema: () =>
        z.object({
          modifiedItems: z
            .object({
              created: z.array(FILE_WITH_PATH).describe('The files created'),
              updated: z.array(FILE_WITH_PATH).describe('The files updated'),
              deleted: z.array(z.union([FILE_WITH_PATH, FOLDER_WITH_PATH])).describe('The files and folders deleted'),
            })
            .describe('The modified items'),
        }),
    },
  },
})
