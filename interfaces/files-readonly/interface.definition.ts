/* bplint-disable */
import * as sdk from '@botpress/sdk'

const BASE_ITEM = (itemType: 'file' | 'folder' | 'item' = 'item') =>
  sdk.z.object({
    id: sdk.z
      .string()
      .describe(
        `The ${itemType}'s ID. This could be a unique identifier from the external service, or a relative or absolute path, so long as it's unique.`
      ),
    type: sdk.z.union([sdk.z.literal('file'), sdk.z.literal('folder')]).describe('The entity type'),
    name: sdk.z
      .string()
      .describe(
        `The ${itemType}'s name. This will be displayed in the Botpress UI and be used as the ${itemType}'s name on Files API."`
      ),
    parentId: sdk.z
      .string()
      .optional()
      .describe(`The parent folder ID. Leave empty if the ${itemType} is in the root folder.`),
    absolutePath: sdk.z
      .string()
      .optional()
      .describe(`The absolute path of the ${itemType}. Leave empty if not available.`),
  })

const FOLDER = BASE_ITEM('folder').extend({
  type: sdk.z.literal('folder'),
})

const FILE = BASE_ITEM('file').extend({
  type: sdk.z.literal('file'),
  sizeInBytes: sdk.z.number().optional().describe('The file size in bytes, if available'),
  lastModifiedDate: sdk.z.string().datetime().optional().describe('The last modified date of the file, if available'),
  contentHash: sdk.z
    .string()
    .optional()
    .describe('The hash of the file content, or version/revision number, if available'),
})

const FILE_WITH_PATH = FILE.extend({
  absolutePath: sdk.z.string().describe('The full path of the file'),
})

const FOLDER_WITH_PATH = FOLDER.extend({
  absolutePath: sdk.z.string().describe('The full path of the folder'),
})

const NEXT_TOKEN = sdk.z.string().optional().describe('The token to get the next page of items.')

export default new sdk.InterfaceDefinition({
  name: 'files-readonly',
  version: '0.3.0',
  actions: {
    listItemsInFolder: {
      attributes: {
        ...sdk.WELL_KNOWN_ATTRIBUTES.HIDDEN_IN_STUDIO,
      },
      title: 'List items in folder',
      description: 'List the files and folders in a folder',
      input: {
        schema: () =>
          sdk.z.object({
            folderId: FOLDER.shape.id
              .optional()
              .describe('The folder ID to list the items from. Leave empty to list items from the root folder.'),
            filters: sdk.z
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
          sdk.z.object({
            items: sdk.z.array(sdk.z.union([FILE, FOLDER])).describe('The files and folders in the folder'),
            meta: sdk.z.object({
              nextToken: NEXT_TOKEN,
            }),
          }),
      },
    },
    transferFileToBotpress: {
      attributes: {
        ...sdk.WELL_KNOWN_ATTRIBUTES.HIDDEN_IN_STUDIO,
      },
      title: 'Transfer file to Botpress',
      description: 'Transfer a file from an external service to Botpress',
      input: {
        schema: () =>
          sdk.z.object({
            file: FILE.title('File to transfer').describe('The file to transfer'),
            fileKey: sdk.z.string().title('File key').describe('The file key to use in Botpress'),
            shouldIndex: sdk.z
              .boolean()
              .optional()
              .title('Should index file?')
              .describe('Whether to index the file in vector storage'),
          }),
      },
      output: {
        schema: () =>
          sdk.z.object({
            botpressFileId: sdk.z.string().describe('The file ID of the uploaded file on Botpress'),
          }),
      },
    },
  },
  events: {
    fileCreated: {
      schema: () =>
        sdk.z.object({
          file: FILE_WITH_PATH.describe('The created file'),
        }),
    },
    fileUpdated: {
      schema: () =>
        sdk.z.object({
          file: FILE_WITH_PATH.describe('The updated file'),
        }),
    },
    fileDeleted: {
      schema: () =>
        sdk.z.object({
          file: FILE_WITH_PATH.describe('The deleted file'),
        }),
    },
    folderDeletedRecursive: {
      schema: () =>
        sdk.z.object({
          folder: FOLDER_WITH_PATH.describe('The deleted folder'),
        }),
    },
    aggregateFileChanges: {
      schema: () =>
        sdk.z.object({
          modifiedItems: sdk.z
            .object({
              created: sdk.z.array(FILE_WITH_PATH).describe('The files created'),
              updated: sdk.z.array(FILE_WITH_PATH).describe('The files updated'),
              deleted: sdk.z
                .array(sdk.z.union([FILE_WITH_PATH, FOLDER_WITH_PATH]))
                .describe('The files and folders deleted'),
            })
            .describe('The modified items'),
        }),
    },
  },
})
