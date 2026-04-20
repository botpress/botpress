import { z } from '@botpress/sdk'

export const trelloIdRegex = /^[0-9a-fA-F]{24}$/

export const trelloIdSchema = z.string().regex(trelloIdRegex)
export type TrelloID = z.infer<typeof trelloIdSchema>

export const boardSchema = z.object({
  id: trelloIdSchema.title('Board ID').describe('Unique identifier of the board'),
  name: z.string().title('Board Name').describe('The name of the board'),
})
export type Board = z.infer<typeof boardSchema>

export const cardSchema = z.object({
  id: trelloIdSchema.title('Card ID').describe('Unique identifier of the card'),
  name: z.string().title('Card Name').describe('The preview name of the card'),
  description: z.string().title('Card Description').describe('Detailed description of the card'),
  listId: trelloIdSchema.title('List ID').describe('Identifier of the list the card belongs to'),
  verticalPosition: z.number().title('Position').describe('Position of the card within the list'),
  isClosed: z.boolean().title('Is Closed').describe('Indicates if the card is closed'),
  isCompleted: z.boolean().title('Is Completed').describe('Indicates if the card is completed'),
  dueDate: z.string().datetime().optional().title('Due Date').describe('The expected completed by date (Optional)'),
  labelIds: z.array(trelloIdSchema).title('Label IDs').describe('A list of label IDs attached to the card'),
  memberIds: z.array(trelloIdSchema).title('Member IDs').describe('A list of member IDs assigned to the card'),
})
export type Card = z.infer<typeof cardSchema>

export const listSchema = z.object({
  id: trelloIdSchema.title('List ID').describe('Unique identifier of the list'),
  name: z.string().title('List Name').describe('The name of the list'),
})
export type List = z.infer<typeof listSchema>

export const memberSchema = z.object({
  id: trelloIdSchema.title('Member ID').describe('Unique identifier of the member'),
  username: z.string().title('Username').describe('A public alias that represents the member'),
  fullName: z.string().title('Full Name').describe('Full name of the member'),
})
export type Member = z.infer<typeof memberSchema>

export const webhookSchema = z.object({
  id: trelloIdSchema.title('Webhook ID').describe('Unique identifier of the webhook'),
  modelId: trelloIdSchema.title('Model ID').describe('ID of the Trello model the webhook watches for events'),
  callbackUrl: z
    .string()
    .url()
    .title('Callback URL')
    .describe('The URL that Trello will call when a webhook event occurs'),
})
export type Webhook = z.infer<typeof webhookSchema>
