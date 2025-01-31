import * as sdk from '@botpress/sdk'
import { BaseItem } from './abstract/base-item'
const { z } = sdk

export namespace Folder {
  const _fields = {
    ...BaseItem.schema.shape,
    itemType: z.literal('folder').title('Item Type').describe('The type of the item.'),
  } as const

  export const schema = z.object(_fields)
  export type InferredType = sdk.z.infer<typeof schema>
}
