import { z } from '@botpress/sdk'
import { trelloIdSchema } from 'definitions/schemas'
import {
  commentAddedEventSchema,
  commentDeletedEventSchema,
  commentUpdatedEventSchema,
} from './card-comment-event-schemas'
import {
  cardCreatedEventSchema,
  cardDeletedEventSchema,
  cardUpdatedEventSchema,
  cardVotesUpdatedEventSchema,
} from './card-event-schemas'

export const genericWebhookEventSchema = z.object({
  action: z.union([
    // ---- Card Events ----
    cardCreatedEventSchema,
    cardUpdatedEventSchema,
    cardDeletedEventSchema,
    cardVotesUpdatedEventSchema,
    // ---- Card Comment Events ----
    commentAddedEventSchema,
    commentUpdatedEventSchema,
    commentDeletedEventSchema,
  ]),
  webhook: z.object({
    id: trelloIdSchema,
    idModel: trelloIdSchema,
    active: z.boolean(),
    consecutiveFailures: z.number().min(0),
  }),
})
