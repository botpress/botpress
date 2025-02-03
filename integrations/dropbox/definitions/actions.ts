import * as sdk from '@botpress/sdk'
import { File, Folder } from './entities'
const { z } = sdk

export const actions = {
  listItemsInFolder: {
    title: 'List items in a folder',
    description: 'List files and folders in dropbox within a directory',
    input: {
      schema: z.object({
        path: z
          .string()
          .optional()
          .title('Path')
          .describe("The folder's path. Leave empty to list the contents of the root folder"),
        recursive: z
          .boolean()
          .title('List recursively?')
          .optional()
          .default(false)
          .describe('Whether to recursively visit subfolders'),
        nextToken: z
          .string()
          .title('Pagination token')
          .min(1)
          .optional()
          .describe('The cursor to continue the pagination'),
      }),
    },
    output: {
      schema: z.object({
        items: z
          .array(z.union([File.schema, Folder.schema]))
          .title('Items')
          .describe('The list of files and folders in the folder'),
        nextToken: z
          .string()
          .title('Pagination token')
          .optional()
          .describe(
            "The cursor to use for pagination. If the cursor is present, you may use it to fetch the next page of results. If it's not present, it means there are no more results"
          ),
      }),
    },
  },
  createFile: {
    title: 'Upload File',
    description: 'Upload a file to dropbox',
    input: {
      schema: z.object({
        contents: z.string().min(1).title('Contents').describe("The file's contents"),
        path: z.string().min(1).title('Path').describe("The file's path, including the file name and extension"),
      }),
    },
    output: {
      schema: z.object({ newFile: File.schema.title('New File').describe('The newly-uploaded file') }),
    },
  },
  createFolder: {
    title: 'Create Folder',
    description: 'Create a folder in dropbox',
    input: {
      schema: z.object({
        path: z.string().min(1).title('Path').describe("The folder's path"),
      }),
    },
    output: {
      schema: z.object({ newFolder: Folder.schema.title('New Folder').describe('The newly-created folder') }),
    },
  },
  deleteItem: {
    title: 'Delete Item',
    description: 'Deletes a file or folder from dropbox',
    input: {
      schema: z.object({
        path: z.string().title('Path').min(1).describe('The path of the item to delete'),
      }),
    },
    output: {
      schema: z.object({}),
    },
  },
  downloadFile: {
    title: 'Download File',
    description: 'Download a file from dropbox',
    input: {
      schema: z.object({ path: z.string().title('Path').min(1).describe("The file's path on Dropbox") }),
    },
    output: {
      schema: z.object({
        fileUrl: z.string().title('Download URL').describe('The url to download the file from'),
      }),
    },
  },
  downloadFolder: {
    title: 'Download Folder',
    description: 'Download a folder from dropbox',
    input: {
      schema: z.object({ path: z.string().title('Path').min(1).describe("The folder's path on Dropbox") }),
    },
    output: {
      schema: z.object({
        zipUrl: z
          .string()
          .title('Download URL')
          .describe('The url to download the folder from, compressed as a zip archive.'),
      }),
    },
  },
  copyItem: {
    title: 'Copy Item',
    description: 'Copy a file or folder to a new location in dropbox',
    input: {
      schema: z.object({
        fromPath: z.string().title('Source Path').min(1).describe("The item's source path"),
        toPath: z.string().title('Destination Path').min(1).describe("The item's destination path"),
      }),
    },
    output: {
      schema: z.object({
        newItem: z.union([File.schema, Folder.schema]).title('New item').describe('The newly-created item'),
      }),
    },
  },
  moveItem: {
    title: 'Move Item',
    description: 'Move a file or folder in dropbox',
    input: {
      schema: z.object({
        fromPath: z.string().title('Source Path').min(1).describe("The item's source path"),
        toPath: z.string().title('Destination Path').min(1).describe("The item's destination path"),
      }),
    },
    output: {
      schema: z.object({
        newItem: z.union([File.schema, Folder.schema]).title('Moved item').describe('The item that was moved'),
      }),
    },
  },
  searchItems: {
    title: 'Search Items',
    description: 'Search for files and folders in dropbox',
    input: {
      schema: z.object({
        query: z.string().title('Search query').min(1).describe('Keywords to search for'),
        path: z.string().title('Path').optional().describe('The path to search in'),
        orderBy: z
          .enum(['relevance', 'last_modified_time'])
          .title('Order By')
          .optional()
          .describe('How to sort the results'),
        fileNameOnly: z
          .boolean()
          .title('Search only within names?')
          .optional()
          .default(false)
          .describe('Whether to search only in file names'),
        fileExtensions: z
          .array(z.string().title('File extension').describe('The file extension to search for'))
          .optional()
          .title('Filter by extension')
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
          .optional()
          .title('Filter by categories')
          .describe('The file categories to search for'),
        nextToken: z
          .string()
          .title('Pagination Token')
          .min(1)
          .optional()
          .describe('The cursor to continue the pagination'),
      }),
    },
    output: {
      schema: z.object({
        results: z
          .array(
            z.object({
              item: z.union([File.schema, Folder.schema]).title('Item').describe('The matched item'),
              matchType: z
                .enum(['filename', 'file_content', 'filename_and_content', 'image_content', 'metadata', 'other'])
                .title('Match type')
                .describe('The type of match')
                .optional(),
            })
          )
          .title('Matches')
          .describe('A list of matches for the query'),
        nextToken: z
          .string()
          .title('Pagination Token')
          .optional()
          .describe(
            "The cursor to use for pagination. If the cursor is present, you may use it to fetch the next page of results. If it's not present, it means there are no more results"
          ),
      }),
    },
  },
} as const satisfies sdk.IntegrationDefinitionProps['actions']
