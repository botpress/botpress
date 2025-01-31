import * as sdk from '@botpress/sdk'
const { z } = sdk

export namespace BaseItem {
  const _fields = {
    id: z.string().title('ID').describe('Unique identifier of the item.'),
    itemType: z.string().title('Item Type').describe('The type of the item.'),
    name: z.string().title('Name').describe('The name of the item, including extension.'),
    path: z.string().title('Path').describe("The path to the item in the user's Dropbox."),
    webUrl: z.string().optional().title('Web URL').describe('The URL to view the item on the Dropbox website.'),
    isDeleted: z.boolean().title('Is Deleted?').describe('Whether the item has been deleted.'),
    isShared: z.boolean().title('Is Shared?').describe('Whether the item is shared with other users.'),
  } as const

  export const schema = z.object(_fields)
  export type InferredType = sdk.z.infer<typeof schema>
}
