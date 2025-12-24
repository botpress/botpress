import { z } from '@botpress/sdk'

export const trelloIdRegex = /^[0-9a-fA-F]{24}$/

export const trelloIdSchema = z.string().regex(trelloIdRegex)

export type TrelloID = z.infer<typeof trelloIdSchema>

export const boardSchema = z.object({
  id: trelloIdSchema,
  name: z.string(),
})
export type Board = z.infer<typeof boardSchema>

export const CardSchema = z.object({
  id: trelloIdSchema,
  name: z.string(),
  description: z.string(),
  listId: trelloIdSchema,
  verticalPosition: z.number(),
  isClosed: z.boolean(),
  isCompleted: z.boolean(),
  dueDate: z.string().datetime().optional(),
  labelIds: z.array(trelloIdSchema),
  memberIds: z.array(trelloIdSchema),
})
export type Card = z.infer<typeof CardSchema>

export const ListSchema = z.object({
  id: trelloIdSchema,
  name: z.string(),
})
export type List = z.infer<typeof ListSchema>

export const MemberSchema = z.object({
  id: trelloIdSchema,
  username: z.string(),
  fullName: z.string(),
})
export type Member = z.infer<typeof MemberSchema>
