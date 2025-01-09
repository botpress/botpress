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

const fileCreatedOutputSchema = commonFileMetadataOutputSchema
  .extend({
    created: z.string().min(1).describe("The file's creation date"),
  })
  .omit({
    '.tag': true,
  })

const fileMetadataFetchedOutputSchema = commonFileMetadataOutputSchema.extend({
  clientModified: z.string().min(1).describe("The file's last modified date"),
  serverModified: z.string().min(1).describe("The file's last server modified date"),
})

const listItemsInputSchema = z.object({
  path: z.string().describe("The folder's path. If the path is the root, use an empty string"),
  recursive: z.boolean().optional().default(false).describe('Whether to recursively visit subfolders'),
  limit: z.number().optional().describe('The maximum number of items to return per page'),
  nextToken: z.string().min(1).optional().describe('The cursor to continue the pagination'),
})

const listItemsOutputSchema = z.object({
  entries: z
    .array(z.union([commonMetadataOutputSchema, fileMetadataFetchedOutputSchema]))
    .describe('The list of files and folders in the folder'),
  nextToken: z
    .string()
    .describe("The cursor to use for pagination. It's used to fetch the next page if the hasMore field is true."),
  hasMore: z.boolean().describe('Whether there are more items to fetch'),
})

const batchDeleteOutputSchema = z.object({
  '.tag': z.string().describe("The status of the deletion. It should always be 'complete'"),
  entries: z.array(
    z.object({
      '.tag': z.string().describe("The item's deletion status."),
      metadata: z
        .union([commonMetadataOutputSchema, commonFileMetadataOutputSchema, z.any().describe('Deletion failure')])
        .describe('The item metadata'),
    })
  ),
})

const itemMoveInputSchema = z.object({
  fromPath: z.string().min(1).describe("The item's source path"),
  toPath: z.string().min(1).describe("The item's destination path"),
})

const itemMoveOutputSchema = z.object({
  result: z.union([commonMetadataOutputSchema, commonFileMetadataOutputSchema]).describe("The new item's metadata"),
})

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
    description: "Read a file's metadata in dropbox",
    input: {
      schema: z.object({
        path: z.string().min(1).describe("The file's path"),
      }),
    },
    output: {
      schema: z.object({
        result: z.union([commonMetadataOutputSchema, fileMetadataFetchedOutputSchema]),
      }),
    },
  },
  deleteFile: {
    title: 'Delete File',
    description: 'Deletes a file or folder from dropbox',
    input: {
      schema: z.object({
        path: z.string().min(1).describe("The item's path to delete"),
      }),
    },
    output: {
      schema: z.object({
        result: z
          .union([commonMetadataOutputSchema, commonFileMetadataOutputSchema])
          .describe('The metadata of the deleted item'),
      }),
    },
  },
  deleteBatch: {
    title: 'Batch Delete',
    description: 'Delete multiple items from dropbox',
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
      schema: commonMetadataOutputSchema.omit({
        '.tag': true,
      }),
    },
  },
  copyItem: {
    title: 'Copy Item',
    description: 'Copy an item in dropbox',
    input: {
      schema: itemMoveInputSchema,
    },
    output: {
      schema: itemMoveOutputSchema,
    },
  },
  moveItem: {
    title: 'Move Item',
    description: 'Move an item in dropbox',
    input: {
      schema: itemMoveInputSchema,
    },
    output: {
      schema: itemMoveOutputSchema,
    },
  },
} as const satisfies sdk.IntegrationDefinitionProps['actions']
