import { z } from '@botpress/sdk'
import { trelloIdSchema } from 'definitions/schemas'
import {
  commentAddedEventActionSchema,
  commentDeletedEventActionSchema,
  commentUpdatedEventActionSchema,
} from './card-comment-event-schemas'
import {
  cardCreatedEventActionSchema,
  cardDeletedEventActionSchema,
  cardUpdatedEventActionSchema,
  cardVotesUpdatedEventActionSchema,
} from './card-event-schemas'
import { memberAddedToCardEventActionSchema, memberRemovedFromCardEventActionSchema } from './member-event-schemas'

export const webhookEventSchema = z.object({
  action: z.union([
    // ---- Card Events ----
    cardCreatedEventActionSchema,
    cardUpdatedEventActionSchema,
    cardDeletedEventActionSchema,
    cardVotesUpdatedEventActionSchema,
    // ---- Card Comment Events ----
    commentAddedEventActionSchema,
    commentUpdatedEventActionSchema,
    commentDeletedEventActionSchema,
    // ---- Member Events ----
    memberAddedToCardEventActionSchema,
    memberRemovedFromCardEventActionSchema,
  ]),
  webhook: z.object({
    id: trelloIdSchema,
    idModel: trelloIdSchema,
    active: z.boolean(),
    consecutiveFailures: z.number().min(0),
  }),
})
export type WebhookEvent = z.infer<typeof webhookEventSchema>
