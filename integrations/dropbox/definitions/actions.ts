import * as sdk from '@botpress/sdk'
const { z } = sdk

const fileUploadInputSchema = z.object({
  contents: z.string().min(1).title('Contents').describe("The file's contents"),
  path: z.string().min(1).title('Path').describe("The file's path"),
  description: z.string().title('Description').optional().describe("The file's description (optional)"),
})

const commonMetadataOutputSchema = z.object({
  '.tag': z.string().title('Tag').describe("The item's tag (file or folder)"),
  id: z.string().min(1).title('ID').describe("The item's unique identifier"),
  name: z.string().min(1).title('Name').describe("The item's name"),
  path: z.string().min(1).title('Path').describe("The item's full path"),
})

const commonFileMetadataOutputSchema = commonMetadataOutputSchema.extend({
  revision: z.string().min(1).title('Revision').describe("The file's revision"),
  size: z.number().title('Size').describe("The file's size"),
  fileHash: z.string().min(1).title('fileHash').describe("The file's hash"),
  isDownloadable: z.boolean().title('Is Downloadable?').describe('Whether the file is downloadable'),
})

const fileMetadataFetchedOutputSchema = commonFileMetadataOutputSchema.extend({
  clientModified: z.string().min(1).title('Modified date').describe("The file's last modified date"),
  serverModified: z.string().min(1).title('Server-side modified date').describe("The file's last server modified date"),
})

const folderMetadataFetchedOutputSchema = commonMetadataOutputSchema

// Union of file and folder metadata
// Differentiation can be done through the `.tag` field, which is either 'file' or 'folder'
const itemMetadataFetchedOutputSchema = z.union([fileMetadataFetchedOutputSchema, folderMetadataFetchedOutputSchema])

const fileCreatedOutputSchema = commonFileMetadataOutputSchema
  .extend({
    serverModified: z.string().min(1).title('Server-side modified date').describe("The file's creation date"),
  })
  .omit({
    '.tag': true,
  })

const listItemsInputSchema = z.object({
  path: z.string().title('Path').describe("The folder's path. If the path is the root, use an empty string"),
  recursive: z
    .boolean()
    .title('Is recursive?')
    .optional()
    .default(false)
    .describe('Whether to recursively visit subfolders'),
  limit: z.number().title('Max results').optional().describe('The maximum number of items to return per page'),
  nextToken: z.string().title('Pagination token').min(1).optional().describe('The cursor to continue the pagination'),
})

const listItemsOutputSchema = z.object({
  entries: z
    .array(itemMetadataFetchedOutputSchema)
    .title('Items')
    .describe('The list of files and folders in the folder'),
  nextToken: z
    .string()
    .title('Pagination token')
    .optional()
    .describe("The cursor to use for pagination. It's used to fetch the next page if the hasMore field is true."),
})

const itemMoveInputSchema = z.object({
  fromPath: z.string().title('Source Path').min(1).describe("The item's source path"),
  toPath: z.string().title('Destination Path').min(1).describe("The item's destination path"),
})

const itemMoveOutputSchema = z.object({
  result: itemMetadataFetchedOutputSchema.title('Item metadata').describe("The new item's metadata"),
})

const readItemMetadataInputSchema = z.object({
  path: z.string().title('Path').min(1).describe("The item's path"),
})

const readItemMetadataOutputSchema = z.object({
  result: itemMetadataFetchedOutputSchema.title('Item metadata').describe("The item's metadata"),
})

const deleteItemInputSchema = z.object({
  path: z.string().title('Path').min(1).describe("The item's path to delete"),
})

const deleteItemOutputSchema = z.object({
  result: itemMetadataFetchedOutputSchema.title('Item metadata').describe('The metadata of the deleted item'),
})

const downloadFileInputSchema = z.object({
  path: z.string().title('Path').min(1).describe("The file's path to download"),
})

const downloadFileOutputSchema = z.object({
  fileUrl: z.string().title('Download URL').describe('The url to download the file from'),
})

const downloadFolderInputSchema = z.object({
  path: z.string().title('Path').min(1).describe("The folder's path to download"),
})

const downloadFolderOutputSchema = z.object({
  zipUrl: z.string().title('Download URL').describe('The url to download the folder as a zip file'),
})

const createFolderInputSchema = z.object({
  path: z.string().title('Path').min(1).describe("The folder's path"),
})

const createFolderOutputSchema = folderMetadataFetchedOutputSchema.omit({
  '.tag': true,
})

const searchItemInputSchema = z.object({
  query: z.string().title('Search query').min(1).describe('The search query'),
  options: z
    .object({
      path: z.string().title('Path').optional().describe('The path to search in'),
      limit: z.number().title('Max results').optional().describe('The maximum number of results to return per page'),
      orderBy: z
        .enum(['relevance', 'last_modified_time', 'other'])
        .title('Order By')
        .optional()
        .describe('How to sort the results'),
      fileStatus: z
        .enum(['active', 'deleted'])
        .title('Filter by status')
        .optional()
        .default('active')
        .describe('The file status to search for'),
      fileNameOnly: z
        .boolean()
        .title('Search only within names?')
        .optional()
        .default(false)
        .describe('Whether to search only in file names'),
      fileExtensions: z
        .array(z.string().title('File extension').describe('The file extension to search for'))
        .title('Filter by extension')
        .min(1)
        .optional()
        .describe('The file extensions to search for'),
      fileCategories: z
        .array(
          z.enum([
            'image',
            'document',
            'pdf',
            'spreadsheet',
            'presentation',
            'audio',
            'video',
            'folder',
            'paper',
            'others',
          ])
        )
        .title('Filter by categories')
        .min(1)
        .optional()
        .describe('The file categories to search for'),
      accountId: z.string().title('Filter by account').optional().describe('The account ID to search in'),
    })
    .title('Search options')
    .optional()
    .describe('Additional options to customize the search'),
  matchFieldOptions: z
    .object({
      includeHighlights: z
        .boolean()
        .title('Include highlights?')
        .optional()
        .default(false)
        .describe('Whether to include highlights in the search results'),
    })
    .optional()
    .title('Match field options')
    .describe('Options for search results match fields.'),
  nextToken: z.string().title('Pagination Token').min(1).optional().describe('The cursor to continue the pagination'),
})

const searchItemOutputSchema = z.object({
  matches: z
    .array(
      z.object({
        metadata: itemMetadataFetchedOutputSchema.title('Item metadata').describe('The metadata of the matched item'),
        matchType: z
          .enum(['filename', 'file_content', 'filename_and_content', 'image_content', 'metadata', 'other'])
          .title('Match type')
          .describe('The type of match')
          .optional(),
        highlightSpans: z
          .array(
            z.object({
              highlightString: z.string(),
              isHighlighted: z.boolean(),
            })
          )
          .title('Highlight spans')
          .describe('The highlighted spans in the match')
          .optional(),
      })
    )
    .title('Matches')
    .describe('A list of matches for the query'),
  nextToken: z.string().title('Pagination Token').optional().describe('The cursor to continue the pagination'),
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
    description: "Read a file or item's metadata in dropbox",
    input: {
      schema: readItemMetadataInputSchema,
    },
    output: {
      schema: readItemMetadataOutputSchema,
    },
  },
  deleteItem: {
    title: 'Delete Item',
    description: 'Deletes a file or folder from dropbox',
    input: {
      schema: deleteItemInputSchema,
    },
    output: {
      schema: deleteItemOutputSchema,
    },
  },
  downloadFile: {
    title: 'Download File',
    description: 'Download a file from dropbox',
    input: {
      schema: downloadFileInputSchema,
    },
    output: {
      schema: downloadFileOutputSchema,
    },
  },
  downloadFolder: {
    title: 'Download Folder',
    description: 'Download a folder from dropbox',
    input: {
      schema: downloadFolderInputSchema,
    },
    output: {
      schema: downloadFolderOutputSchema,
    },
  },
  createFolder: {
    title: 'Create Folder',
    description: 'Create a folder in dropbox',
    input: {
      schema: createFolderInputSchema,
    },
    output: {
      schema: createFolderOutputSchema,
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
  searchItems: {
    title: 'Search Items',
    description: 'Search for files and folders in dropbox',
    input: {
      schema: searchItemInputSchema,
    },
    output: {
      schema: searchItemOutputSchema,
    },
  },
} as const satisfies sdk.IntegrationDefinitionProps['actions']
