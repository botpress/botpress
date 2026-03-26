import * as sdk from '@botpress/sdk'

const _baseItem = (itemType: 'file' = 'file') =>
  sdk.z.object({
    id: sdk.z
      .string()
      .describe(
        `The ${itemType}'s ID. This could be a unique identifier from the external service, or a relative or absolute path, so long as it's unique.`
      ),
    name: sdk.z
      .string()
      .describe(
        `The ${itemType}'s name. This will be displayed in the Botpress UI and be used as the ${itemType}'s name on Files API."`
      ),
    type: sdk.z.union([sdk.z.literal('file'), sdk.z.literal('folder')]).describe('The entity type'),
  })

export const FILE = _baseItem().extend({
  type: sdk.z.literal('file'),
  sizeInBytes: sdk.z.number().optional().describe('The file size in bytes, if available'),
  contentHash: sdk.z.string().optional().describe('A content hash provided by the external service for deduplication'),
})

export const FILE_WITH_PATH = FILE.extend({
  absolutePath: sdk.z.string().describe('The absolute path of the file'),
})

export type File = sdk.z.infer<typeof FILE>
export type FileWithPath = sdk.z.infer<typeof FILE_WITH_PATH>
