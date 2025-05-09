import { z } from '@botpress/sdk'

export const configurationSchema = z.object({
  personalAccessToken: z
    .string()
    .min(1)
    .title('Personal Access Token')
    .describe(
      'The personal access token for your Monday.com account with sufficient access to manage items on your Monday.com boards.'
    ),
  boardIds: z
    .array(z.string().title('Board ID'))
    .title('Board IDs')
    .describe('The Board IDs for which you would like the bot to sync items'),
})

export const itemsTableSchema = z.object({
  boardId: z.string().title('Board ID').describe('The Board ID in Monday.com to which the item belongs'),
  itemId: z.string().title('Item ID').describe('The ID for the item in Monday.com'),
  name: z.string().title('Name').describe("The item's name"),
})

export const createItemSchema = z.object({
  boardId: z
    .string()
    .title('Board ID')
    .describe("The board's unique identifier. The new item will be added to this board."),
  itemName: z.string().min(1).title('Name').describe("The new item's name."),
})

export const syncItemsSchema = z.object({
  boardId: z
    .string()
    .title('Board ID')
    .describe("The board's unique identifier. Items will be synced from this board."),
})
