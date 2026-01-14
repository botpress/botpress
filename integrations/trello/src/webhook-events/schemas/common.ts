import { z } from '@botpress/sdk'
import { TrelloEventType } from 'definitions/events'
import { trelloIdSchema } from 'definitions/schemas'

export const baseEventActionSchema = z.object({
  /** Action ID (aka Event ID) */
  id: trelloIdSchema,
  /** Event Triggered Date */
  date: z.coerce.date(),
  type: z.nativeEnum(TrelloEventType),
  data: z.any(),
  /** Member who initiated the action */
  memberCreator: z.object({
    id: trelloIdSchema,
    fullName: z.string(),
    username: z.string(),
    initials: z.string(),
    avatarHash: z.string(),
    avatarUrl: z.string(),
  }),
})
