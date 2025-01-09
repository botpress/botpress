import * as sdk from '@botpress/sdk'
const { z } = sdk

const fileUploadInputSchema = z.object({
  contents: z.string().min(1).describe("The file's contents"),
  path: z.string().min(1).describe("The file's path"),
  description: z.string().optional().describe("The file's description (optional)"),
})

const commonMetadataOutputSchema = z.object({
  '.tag': z.string().describe("The item's tag (file or folder)"),
  id: z.string().min(1).describe("The item's unique identifier"),
  name: z.string().min(1).describe("The item's name"),
  path: z.string().min(1).describe("The item's full path"),
})

const commonFileMetadataOutputSchema = commonMetadataOutputSchema.extend({
  revision: z.string().min(1).describe("The file's revision"),
  size: z.number().describe("The file's size"),
  fileHash: z.string().min(1).describe("The file's hash"),
  isDownloadable: z.boolean().describe('Whether the file is downloadable'),
})

const fileMetadataFetchedOutputSchema = commonFileMetadataOutputSchema.extend({
  clientModified: z.string().min(1).describe("The file's last modified date"),
  serverModified: z.string().min(1).describe("The file's last server modified date"),
})

const folderMetadataFetchedOutputSchema = commonMetadataOutputSchema

// Union of file and folder metadata
// Differentiation can be done through the `.tag` field, which is either 'file' or 'folder'
const itemMetadataFetchedOutputSchema = z.union([fileMetadataFetchedOutputSchema, folderMetadataFetchedOutputSchema])

const fileCreatedOutputSchema = commonFileMetadataOutputSchema
  .extend({
    created: z.string().min(1).describe("The file's creation date"),
  })
  .omit({
    '.tag': true,
  })

const listItemsInputSchema = z.object({
  path: z.string().describe("The folder's path. If the path is the root, use an empty string"),
  recursive: z.boolean().optional().default(false).describe('Whether to recursively visit subfolders'),
  limit: z.number().optional().describe('The maximum number of items to return per page'),
  nextToken: z.string().min(1).optional().describe('The cursor to continue the pagination'),
})

const listItemsOutputSchema = z.object({
  entries: z.array(itemMetadataFetchedOutputSchema).describe('The list of files and folders in the folder'),
  nextToken: z
    .string()
    .describe("The cursor to use for pagination. It's used to fetch the next page if the hasMore field is true."),
  hasMore: z.boolean().describe('Whether there are more items to fetch'),
})

const itemMoveInputSchema = z.object({
  fromPath: z.string().min(1).describe("The item's source path"),
  toPath: z.string().min(1).describe("The item's destination path"),
})

const itemMoveOutputSchema = z.object({
  result: itemMetadataFetchedOutputSchema.describe("The new item's metadata"),
})

function buildItemBatchOperationOutputSchema(tag: string) {
  return z.object({
    '.tag': z.string().describe(`The status of the ${tag}. It should always be 'complete'`),
    entries: z
      .array(
        z.object({
          '.tag': z.string().describe(`The item's ${tag} status.`),
          metadata: z
            .union([itemMetadataFetchedOutputSchema, z.any().describe(`${tag} failure`)])
            .describe('The item metadata'),
        })
      )
      .describe(`The ${tag} results`),
  })
}
const batchDeleteOutputSchema = buildItemBatchOperationOutputSchema('deletion')
const batchMoveItemsOutputSchema = buildItemBatchOperationOutputSchema('move')
const batchCopyItemsOutputSchema = buildItemBatchOperationOutputSchema('copy')

export const actions = {
  listItemsInFolder: {
    title: 'List items in a folder',
    description: 'List files and folders in dropbox within a directory',
    input: {
      schema: listItemsInputSchema,
    },
    output: {
      schema: listItemsOutputSchema,
    },
  },
  createFile: {
    title: 'Upload File',
    description: 'Upload a file to dropbox',
    input: {
      schema: fileUploadInputSchema,
    },
    output: {
      schema: fileCreatedOutputSchema,
    },
  },
  readItemMetadata: {
    title: 'Read item metadata',
    description: "Read a file or item's metadata in dropbox",
    input: {
      schema: z.object({
        path: z.string().min(1).describe("The item's path"),
      }),
    },
    output: {
      schema: z.object({
        result: itemMetadataFetchedOutputSchema,
      }),
    },
  },
  deleteItem: {
    title: 'Delete Item',
    description: 'Deletes a file or folder from dropbox',
    input: {
      schema: z.object({
        path: z.string().min(1).describe("The item's path to delete"),
      }),
    },
    output: {
      schema: z.object({
        result: itemMetadataFetchedOutputSchema.describe('The metadata of the deleted item'),
      }),
    },
  },
  deleteBatch: {
    title: 'Batch Delete',
    description: 'Delete multiple files or folders from dropbox',
    input: {
      schema: z.object({
        paths: z.array(z.string()).min(1).describe('The paths of the items to delete'),
      }),
    },
    output: {
      schema: batchDeleteOutputSchema,
    },
  },
  downloadFile: {
    title: 'Download File',
    description: 'Download a file from dropbox',
    input: {
      schema: z.object({
        path: z.string().min(1).describe("The file's path to download"),
      }),
    },
    output: {
      schema: z.object({
        fileUrl: z.string().describe('The url to download the file from'),
      }),
    },
  },
  downloadFolder: {
    title: 'Download Folder',
    description: 'Download a folder from dropbox',
    input: {
      schema: z.object({
        path: z.string().min(1).describe("The folder's path to download"),
      }),
    },
    output: {
      schema: z.object({
        zipUrl: z.string().describe('The url to download the folder as a zip file'),
      }),
    },
  },
  createFolder: {
    title: 'Create Folder',
    description: 'Create a folder in dropbox',
    input: {
      schema: z.object({
        path: z.string().min(1).describe("The folder's path"),
      }),
    },
    output: {
      schema: folderMetadataFetchedOutputSchema.omit({
        '.tag': true,
      }),
    },
  },
  copyItem: {
    title: 'Copy Item',
    description: 'Copy a file or folder in dropbox',
    input: {
      schema: itemMoveInputSchema,
    },
    output: {
      schema: itemMoveOutputSchema,
    },
  },
  batchCopyItems: {
    title: 'Batch Copy Items',
    description: 'Copy multiple files or folders in dropbox',
    input: {
      schema: z.object({
        entries: z.array(itemMoveInputSchema).min(2).describe('The items to copy'),
      }),
    },
    output: {
      schema: batchCopyItemsOutputSchema,
    },
  },
  moveItem: {
    title: 'Move Item',
    description: 'Move a file or folder in dropbox',
    input: {
      schema: itemMoveInputSchema,
    },
    output: {
      schema: itemMoveOutputSchema,
    },
  },
  batchMoveItems: {
    title: 'Batch Move Items',
    description: 'Move multiple files or folders in dropbox',
    input: {
      schema: z.object({
        entries: z.array(itemMoveInputSchema).min(2).describe('The items to move'),
      }),
    },
    output: {
      schema: batchMoveItemsOutputSchema,
    },
  },
} as const satisfies sdk.IntegrationDefinitionProps['actions']
