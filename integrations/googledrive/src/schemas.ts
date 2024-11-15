import { z } from '@botpress/sdk'
import { APP_GOOGLE_FOLDER_MIMETYPE, APP_GOOGLE_SHORTCUT_MIMETYPE } from './mime-types'

export const ID_DESCRIPTION = 'The ID of the Google Drive file'

// Utility schemas
export const commonFileAttrSchema = z.object({
  id: z.string().min(1).describe(ID_DESCRIPTION),
  name: z.string().min(1).describe('The name of the file'),
  parentId: z
    .string()
    .min(1)
    .optional()
    .describe("The ID of the file that is the parent of this file. If not set, 'My Drive' is the parent"),
  mimeType: z.string().min(1).describe('The media type of the file'),
})

export const baseNormalFileSchema = commonFileAttrSchema.extend({
  size: z.number().nonnegative().describe('The size in bytes of the file'),
})

export const baseFolderFileSchema = commonFileAttrSchema.extend({
  mimeType: z.literal(APP_GOOGLE_FOLDER_MIMETYPE),
})

export const baseShortcutFileSchema = commonFileAttrSchema.extend({
  mimeType: z.literal(APP_GOOGLE_SHORTCUT_MIMETYPE),
})

/* Used to represent a generic file, closer to what is received by the API.
Type is added to enable discrimination and remove/add access to properties
depending on file type. */
export const baseGenericFileSchema = z.discriminatedUnion('type', [
  baseNormalFileSchema.extend({ type: z.literal('normal') }),
  baseFolderFileSchema.extend({ type: z.literal('folder') }),
  baseShortcutFileSchema.extend({ type: z.literal('shortcut') }),
])

// Entities
const computedFileAttrSchema = z.object({
  path: z
    .array(
      z
        .string()
        .min(1)
        .describe("A component of the path of the file. It corresponds to the name of one of it's parents.")
    )
    .describe("An array of the path's components sorted by level (root to leaf)"),
})
export const fileSchema = baseNormalFileSchema.merge(computedFileAttrSchema)
export const folderSchema = baseFolderFileSchema.merge(computedFileAttrSchema)

// Action args/outputs
function createListOutputSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    items: z
      .array(itemSchema)
      .describe(
        'The list of items listed in Google Drive. Results may be paginated. If set, use nextToken to get additional results'
      ),
    meta: z.object({
      nextToken: z
        .string()
        .optional()
        .describe('The token to pass as input to the next call of the list action to list additional items'),
    }),
  })
}

export const createFileArgSchema = commonFileAttrSchema.omit({
  id: true, // Unknown at creation time
})
export const readFileArgSchema = z.object({ id: z.string().describe(ID_DESCRIPTION) })
export const updateFileArgSchema = commonFileAttrSchema.omit({
  mimeType: true, // Cannot be changed unless data is uploaded with a new type
})
export const deleteFileArgSchema = z.object({ id: z.string().describe(ID_DESCRIPTION) })
export const listItemsInputSchema = z.object({
  nextToken: z.string().optional().describe('The token to use to get the next page of results'),
})
export const listItemsOutputSchema = createListOutputSchema(z.any())
export const listFilesOutputSchema = createListOutputSchema(fileSchema)
export const listFoldersOutputSchema = createListOutputSchema(folderSchema)

// URL is used instead of ID because an integration can't access all files of a bot
// using the files API
export const uploadFileDataArgSchema = z.object({
  id: z.string().min(1),
  url: z.string().min(1).describe('The URL used to access the file whose content will be uploaded to Google Drive'),
  mimeType: z
    .string()
    .min(1)
    .optional()
    .describe('Media type of the uploaded content. This will override any previously set media type'),
})
export const downloadFileDataArgSchema = z.object({
  id: z.string().min(1).describe('The ID of the Google Drive file whose content will be downloaded'),
  index: z.boolean().describe('Indicates if the file is to be indexed or not'),
})
export const downloadFileDataOutputSchema = z.object({
  bpFileId: z
    .string()
    .min(1)
    .describe('The Botpress file ID corresponding to the file that was uploaded from Google Drive to the Files API'),
})
