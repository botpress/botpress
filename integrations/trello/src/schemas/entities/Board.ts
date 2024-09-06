import { z } from '@botpress/sdk'
import { TrelloIDSchema } from 'src/schemas'

export const BoardSchema = z.object({
  id: TrelloIDSchema,
  name: z.string(),
})

export type Board = z.infer<typeof BoardSchema>
