import { z } from '@botpress/sdk'
import { TrelloIDSchema } from '..'

export const CardSchema = z.object({
  id: TrelloIDSchema,
  name: z.string(),
  description: z.string(),
  listId: TrelloIDSchema,
  verticalPosition: z.number(),
})

export type Card = z.infer<typeof CardSchema>

export default CardSchema
