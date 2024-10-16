import { z } from '@botpress/sdk'

export const trelloIdRegex = /[0-9a-fA-F]{24}/

export const TrelloIDSchema = z
  .string()
  .length(24)
  .regex(new RegExp(`^${trelloIdRegex.source}$`))

export type TrelloID = z.infer<typeof TrelloIDSchema>

export const BoardSchema = z.object({
  id: TrelloIDSchema,
  name: z.string(),
})

export const CardSchema = z.object({
  id: TrelloIDSchema,
  name: z.string(),
  description: z.string(),
  listId: TrelloIDSchema,
  verticalPosition: z.number(),
  isClosed: z.boolean(),
  isCompleted: z.boolean(),
  dueDate: z.string().datetime().optional(),
  labelIds: z.array(TrelloIDSchema),
  memberIds: z.array(TrelloIDSchema),
})

export const ListSchema = z.object({
  id: TrelloIDSchema,
  name: z.string(),
})

export const MemberSchema = z.object({
  id: TrelloIDSchema,
  username: z.string(),
  fullName: z.string(),
})

export type Board = z.infer<typeof BoardSchema>
export type Card = z.infer<typeof CardSchema>
export type List = z.infer<typeof ListSchema>
export type Member = z.infer<typeof MemberSchema>
