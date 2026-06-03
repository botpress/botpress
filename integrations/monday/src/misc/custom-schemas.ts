import { z } from '@botpress/sdk'

export const configurationSchema = z.object({})

export const manualConfigurationSchema = z.object({
  personalAccessToken: z
    .string()
    .min(1)
    .secret()
    .title('Personal Access Token')
    .describe('A Monday.com personal access token with sufficient access to manage items on your Monday.com boards.'),
})

export const createItemSchema = z.object({
  boardId: z
    .string()
    .title('Board ID')
    .describe("The board's unique identifier. The new item will be added to this board."),
  itemName: z.string().min(1).title('Name').describe("The new item's name."),
})
