import { z } from '@botpress/sdk'
import { APP_GOOGLE_FOLDER_MIMETYPE, APP_GOOGLE_SHORTCUT_MIMETYPE } from './mime-types'

// Utility schemas
export const fileIdSchema = z.string().min(1).describe('The ID of the Google Drive file')
export const commonFileAttrSchema = z.object({
  id: fileIdSchema,
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

const _fileTypesArray = ['normal', 'folder', 'shortcut'] as const
export const fileTypesEnumSchema = z.enum(_fileTypesArray)
const _fileTypes = fileTypesEnumSchema.Enum
export const fileTypesUnionSchema = z.union([
  z.literal(_fileTypes.normal),
  z.literal(_fileTypes.folder),
  z.literal(_fileTypes.shortcut),
])

/* Used to represent a generic file, closer to what is received by the API.
Type is added to enable discrimination and remove/add access to properties
depending on file type. */
export const baseDiscriminatedFileSchema = z.discriminatedUnion('type', [
  baseNormalFileSchema.extend({ type: z.literal(_fileTypes.normal) }),
  baseFolderFileSchema.extend({ type: z.literal(_fileTypes.folder) }),
  baseShortcutFileSchema.extend({ type: z.literal(_fileTypes.shortcut) }),
])

export const baseChannelSchema = z.object({
  id: z.string().min(1).describe('The ID of the channel'),
  resourceId: z.string().min(1).describe('The ID of the watched resource (different from the file ID)'),
})

const notificationTypesSchema = z.union([
  z.literal('sync'),
  z.literal('add'),
  z.literal('remove'),
  z.literal('update'),
  z.literal('trash'),
  z.literal('untrash'),
  z.literal('change'),
])
const updateDetailTypesSchema = z.union([
  z.literal('content'),
  z.literal('properties'),
  z.literal('parents'),
  z.literal('children'),
  z.literal('permissions'),
])
export const notificationSchema = z.object({
  headers: z.object({
    'x-goog-resource-state': notificationTypesSchema,
    'x-goog-changed': z
      .string()
      .optional() // May be present on 'update' notifications
      .transform((details) => details?.split(',') ?? [])
      .pipe(z.array(updateDetailTypesSchema)),
    'x-goog-channel-token': z.string(),
  }),
})

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
export const shortcutSchema = baseShortcutFileSchema.merge(computedFileAttrSchema)
export const genericFileSchema = z.discriminatedUnion('type', [
  fileSchema.extend({ type: z.literal(_fileTypes.normal) }),
  folderSchema.extend({ type: z.literal(_fileTypes.folder) }),
  shortcutSchema.extend({ type: z.literal(_fileTypes.shortcut) }),
])
export const fileChannelSchema = baseChannelSchema.extend({
  fileId: fileIdSchema,
})

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
export const readFileArgSchema = z.object({ id: fileIdSchema })
export const updateFileArgSchema = commonFileAttrSchema.omit({
  mimeType: true, // Cannot be changed unless data is uploaded with a new type
})
export const deleteFileArgSchema = z.object({ id: fileIdSchema })
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

export const fileDeletedEventSchema = z.object({
  id: fileIdSchema,
})
export const folderDeletedEventSchema = z.object({
  id: fileIdSchema,
})
