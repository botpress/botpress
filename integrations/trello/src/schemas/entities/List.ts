import { z } from '@botpress/sdk'
import { TrelloIDSchema } from '..'

export const ListSchema = z.object({
  id: TrelloIDSchema,
  name: z.string(),
})

export type List = z.infer<typeof ListSchema>
