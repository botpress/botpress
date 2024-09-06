import { z } from '@botpress/sdk'
import { TrelloIDSchema } from 'src/schemas'

export const MemberSchema = z.object({
  id: TrelloIDSchema,
  username: z.string(),
  fullName: z.string(),
})

export type Member = z.infer<typeof MemberSchema>
