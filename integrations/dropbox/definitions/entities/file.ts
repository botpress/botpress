import * as sdk from '@botpress/sdk'
import { BaseItem } from './abstract/base-item'
const { z } = sdk

export namespace File {
  const _fields = {
    ...BaseItem.schema.shape,
    revision: z.string().min(1).title('Revision').describe("The file's revision"),
    size: z.number().title('Size').describe("The file's size"),
    fileHash: z.string().min(1).title('Checksum').describe("The file's validation hash"),
    isDownloadable: z.boolean().title('Is Downloadable?').describe('Whether the file is downloadable'),
    symlinkTarget: z
      .string()
      .optional()
      .title('Symlink Target')
      .describe('The target of the symlink, if the file is a symlink'),
  } as const

  export const schema = z.object(_fields)
  export type InferredType = sdk.z.infer<typeof schema>
}
