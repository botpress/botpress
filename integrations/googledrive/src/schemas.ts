import { z } from '@botpress/sdk'
import { FOLDER_MIMETYPE, SHORTCUT_MIMETYPE } from './constants'

// Utility schemas
export const commonFileAttrSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  parentId: z.string().min(1).optional(),
  mimeType: z.string().min(1),
})

export const baseNormalFileSchema = commonFileAttrSchema.extend({
  size: z.number().nonnegative(),
})

export const baseFolderFileSchema = commonFileAttrSchema.extend({
  mimeType: z.literal(FOLDER_MIMETYPE),
})

export const baseShortcutFileSchema = commonFileAttrSchema.extend({
  mimeType: z.literal(SHORTCUT_MIMETYPE),
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
  path: z.string().min(1),
})
export const fileSchema = baseNormalFileSchema.merge(computedFileAttrSchema)
export const folderSchema = baseFolderFileSchema.merge(computedFileAttrSchema)

// Action args/outputs
function createListOutputSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    meta: z.object({
      nextToken: z.string().optional(),
    }),
  })
}

export const listFileOutputSchema = createListOutputSchema(fileSchema)
export const listFolderOutputSchema = createListOutputSchema(folderSchema)

export const createFileArgSchema = commonFileAttrSchema.omit({
  id: true, // Unknown at creation time
})

export const updateFileArgSchema = commonFileAttrSchema.omit({
  mimeType: true, // Cannot be changed unless data is uploaded with a new type
})

// URL is used instead of ID because an integration can't access all files of a bot
// using the files API
export const uploadFileDataArgSchema = z.object({
  id: z.string().min(1),
  url: z
    .string()
    .min(1)
    .describe('The URL used to access the file whose content will be uploaded to the Google Drive.'),
  mimeType: z
    .string()
    .min(1)
    .optional()
    .describe('Media type of the uploaded content. This will override any previously set media type.'),
})
export const downloadFileDataArgSchema = z.object({
  id: z.string().min(1).describe('The ID of the Google Drive file whose content will be downloaded'),
  index: z.boolean(),
})
export const downloadFileDataOutputSchema = z.object({
  bpFileId: z
    .string()
    .min(1)
    .describe('The Botpress file ID corresponding to the file that was uploaded from Google Drive to the Files API'),
})
