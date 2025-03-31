import * as sdk from '@botpress/sdk'
const { z } = sdk

export namespace Deleted {
  const _fields = {
    itemType: z.literal('deleted').title('Item Type').describe('The type of the item.'),
    name: z.string().title('Name').describe('The name of the item.'),
    path: z.string().title('Path').describe("The path to the item in the user's Dropbox."),
    isDeleted: z.literal(true).title('Is Deleted?').describe('Whether the item has been deleted.'),
  } as const

  export const schema = z.object(_fields)
  export type InferredType = sdk.z.infer<typeof schema>
}
