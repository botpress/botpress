import { z } from '@botpress/sdk'
import { TrelloEventType } from 'definitions/events'
import { pickIdAndName } from 'definitions/events/common'
import { eventMemberSchema } from 'definitions/events/member-events'
import { boardSchema, cardSchema } from 'definitions/schemas'
import { trelloEventActionSchema } from './common'

export const memberAddedToCardEventActionSchema = trelloEventActionSchema.extend({
  type: z.literal(TrelloEventType.MEMBER_ADDED_TO_CARD),
  data: z.object({
    board: pickIdAndName(boardSchema),
    card: pickIdAndName(cardSchema),
    member: eventMemberSchema,
  }),
})
export type MemberAddedToCardEventAction = z.infer<typeof memberAddedToCardEventActionSchema>

export const memberRemovedFromCardEventActionSchema = trelloEventActionSchema.extend({
  type: z.literal(TrelloEventType.MEMBER_REMOVED_FROM_CARD),
  deactivated: z.boolean(),
  data: z.object({
    board: pickIdAndName(boardSchema),
    card: pickIdAndName(cardSchema),
    member: eventMemberSchema,
  }),
})
export type MemberRemovedFromCardEventAction = z.infer<typeof memberRemovedFromCardEventActionSchema>
