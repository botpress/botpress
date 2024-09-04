import { z } from '@botpress/sdk'
import { TrelloIDSchema } from '..'

export const CardSchema = z.object({
  id: TrelloIDSchema,
  name: z.string(),
  description: z.string(),
  listId: TrelloIDSchema,
  verticalPosition: z.number(),
  isClosed: z.boolean(),
  isCompleted: z.boolean(),
  dueDate: z.date().optional(),
  labelIds: z.array(TrelloIDSchema),
  memberIds: z.array(TrelloIDSchema),
})

export type Card = z.infer<typeof CardSchema>

export default CardSchema
