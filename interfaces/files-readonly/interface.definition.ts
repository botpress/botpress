/* bplint-disable */
import { z, InterfaceDefinition } from '@botpress/sdk'

const BASE_ITEM = (itemType: 'file' | 'folder' | 'item' = 'item') =>
  z.object({
    id: z
      .string()
      .describe(
        `The ${itemType}'s ID. This could be a unique identifier from the external service, or a relative or absolute path.`
      ),
    type: z.union([z.literal('file'), z.literal('folder')]).describe('The entity type'),
    name: z
      .string()
      .describe(
        `The ${itemType}'s name. This will be displayed in the Botpress UI and be used as the ${itemType}'s name on Files API.`
      ),
    parentId: z
      .string()
      .optional()
      .describe(`The parent folder ID. Leave empty if the ${itemType} is in the root folder.`),
  })

const FOLDER = BASE_ITEM('folder').extend({
  type: z.literal('folder'),
})

const FILE = BASE_ITEM('file').extend({
  type: z.literal('file'),
  sizeInBytes: z.number().describe('The file size in bytes'),
  contentType: z.string().describe('IANA media type of the file'),
  lastModifiedDate: z.string().datetime().optional().describe('The last modified date of the file, if available'),
})

const NEXT_TOKEN = z.string().optional().describe('The token to get the next page of items.')

export default new InterfaceDefinition({
  name: 'files-readonly',
  version: '0.1.0',
  entities: {
    file: {
      title: 'File',
      description: 'A file entity',
      schema: FILE,
    },
    folder: {
      title: 'Folder',
      description: 'A folder entity',
      schema: FOLDER,
    },
  },
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
            items: z.union([FILE, FOLDER]).describe('The files and folders in the folder'),
            meta: z.object({
              nextToken: NEXT_TOKEN,
            }),
          }),
      },
    },
    transferFileToFilesApi: {
      title: 'Transfer file to Files API',
      description: 'Transfer a file from an external service to Botpress Files API',
      input: {
        schema: () =>
          z.object({
            fileId: FILE.shape.id.describe('The file ID to download'),
          }),
      },
      output: {
        schema: () =>
          z.object({
            file: FILE.describe('The transfered file'),
            filesApiFileId: z.string().describe('The file ID of the uploaded file in the Files API'),
          }),
      },
    },
  },
  events: {
    fileCreated: {
      schema: () =>
        z.object({
          file: FILE.describe('The created file'),
        }),
    },
    fileUpdated: {
      schema: () =>
        z.object({
          file: FILE.describe('The updated file'),
        }),
    },
    fileDeleted: {
      schema: () =>
        z.object({
          file: FILE.describe('The deleted file'),
        }),
    },
    folderDeletedRecursive: {
      schema: () =>
        z.object({
          folder: FOLDER.describe('The deleted folder'),
        }),
    },
  },
})
