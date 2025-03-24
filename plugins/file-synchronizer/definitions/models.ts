import * as sdk from '@botpress/sdk'

const _baseItem = (itemType: 'file' | 'folder' | 'item' = 'item') =>
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
  })

export const FOLDER = _baseItem('folder').extend({
  type: sdk.z.literal('folder'),
})

export const FILE = _baseItem('file').extend({
  type: sdk.z.literal('file'),
  sizeInBytes: sdk.z.number().optional().describe('The file size in bytes, if available'),
  lastModifiedDate: sdk.z.string().datetime().optional().describe('The last modified date of the file, if available'),
  contentHash: sdk.z
    .string()
    .optional()
    .describe('The hash of the file content, or version/revision number, if available'),
})

export const FILE_WITH_PATH = FILE.extend({
  absolutePath: sdk.z.string().describe('The absolute path of the file'),
})

export type Folder = sdk.z.infer<typeof FOLDER>
export type File = sdk.z.infer<typeof FILE>
export type FileWithPath = sdk.z.infer<typeof FILE_WITH_PATH>
export type FolderItem = Folder | File
