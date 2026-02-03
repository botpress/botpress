import { z } from '@botpress/sdk'
import { TrelloEventType } from 'definitions/events'
import { pickIdAndName } from 'definitions/events/common'
import { eventMemberSchema } from 'definitions/events/member-events'
import { boardSchema, cardSchema } from 'definitions/schemas'
import { trelloWebhookSchema } from './common'

export const memberAddedToCardWebhookSchema = trelloWebhookSchema.extend({
  type: z.literal(TrelloEventType.MEMBER_ADDED_TO_CARD),
  data: z.object({
    board: pickIdAndName(boardSchema),
    card: pickIdAndName(cardSchema),
    member: eventMemberSchema,
  }),
})
export type MemberAddedToCardWebhook = z.infer<typeof memberAddedToCardWebhookSchema>

export const memberRemovedFromCardWebhookSchema = trelloWebhookSchema.extend({
  type: z.literal(TrelloEventType.MEMBER_REMOVED_FROM_CARD),
  data: z.object({
    deactivated: z.boolean(),
    board: pickIdAndName(boardSchema),
    card: pickIdAndName(cardSchema),
    member: eventMemberSchema,
  }),
})
export type MemberRemovedFromCardWebhook = z.infer<typeof memberRemovedFromCardWebhookSchema>
