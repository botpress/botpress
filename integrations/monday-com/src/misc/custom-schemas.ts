import { z } from '@botpress/sdk'

export type Webhook = z.infer<typeof webhookSchema>
export type WebhookNames = (typeof webhookNames)[number]

const baseEventSchema = z.object({
  app: z.literal('monday'),
  triggerTime: z.coerce.date(),
  subscriptionId: z.number(),
  isRetry: z.boolean(),
  userId: z.number(),
  originalTriggerUuid: z.string().nullable(),
  triggerUuid: z.string(),
})
const createItemEventSchema = baseEventSchema.extend({
  type: z.literal('create_pulse'),
  boardId: z.number(),
  pulseId: z.number(),
  pulseName: z.string(),
  groupId: z.string(),
  groupName: z.string(),
  groupColor: z.string(),
  isTopGroup: z.boolean(),
  columnValues: z.record(z.string(), z.unknown()),
})
const deleteItemEventSchema = baseEventSchema.extend({
  type: z.literal('delete_pulse'),
  boardId: z.number(),
  itemId: z.number(),
  itemName: z.string(),
})
const eventSchema = z.discriminatedUnion('type', [createItemEventSchema, deleteItemEventSchema])

export const webhookRequestSchema = z.object({ event: eventSchema })

export const challengeRequestSchema = z.object({ challenge: z.string().min(1) })

export const webhookNames = ['create_item', 'item_deleted'] as const

export const webhookSchema = z.object({
  name: z.enum(webhookNames),
  boardId: z.string(),
  webhookId: z.string(),
})

export const registeredWebhooksSchema = z.object({
  registered: z
    .array(webhookSchema)
    .title('Registered Webhooks')
    .describe('Webhooks in the Monday.com platform which have been auto-registered by the Botpress integration.'),
})

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

export const syncItemsSchema = {
  input: z.object({
    boardId: z
      .string()
      .title('Board ID')
      .describe("The board's unique identifier. Items will be synced from this board."),
    nextToken: z.string().optional().title('Next Token').describe('The token to use to get the next page of items'),
  }),
  output: z.object({
    nextToken: z.string().optional().title('Next Token').describe('The token to use to get the next page of items'),
  }),
}
