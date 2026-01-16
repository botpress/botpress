import { z } from '@botpress/sdk'
import { trelloIdSchema } from 'definitions/schemas'
import {
  cardAttachmentAddedEventActionSchema,
  cardAttachmentRemovedEventActionSchema,
} from './card-attachment-event-schemas'
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
import { cardLabelAddedEventActionSchema, cardLabelRemovedEventActionSchema } from './card-label-event-schemas'
import {
  checklistAddedToCardEventActionSchema,
  checklistItemCreatedEventActionSchema,
  checklistItemDeletedEventActionSchema,
  checklistItemStatusUpdatedEventActionSchema,
  checklistItemUpdatedEventActionSchema,
} from './checklist-event-schemas'
import { trelloEventActionSchema } from './common'
import { memberAddedToCardEventActionSchema, memberRemovedFromCardEventActionSchema } from './member-event-schemas'

const _webhookSchema = z.object({
  id: trelloIdSchema,
  idModel: trelloIdSchema,
  active: z.boolean(),
  consecutiveFailures: z.number().min(0),
})

export const webhookEventPayloadSchema = z.object({
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
    // ---- Card Label Events ----
    cardLabelAddedEventActionSchema,
    cardLabelRemovedEventActionSchema,
    // ---- Card Attachment Events ----
    cardAttachmentAddedEventActionSchema,
    cardAttachmentRemovedEventActionSchema,
    // ---- Checklist Events ----
    checklistAddedToCardEventActionSchema,
    checklistItemCreatedEventActionSchema,
    checklistItemUpdatedEventActionSchema,
    checklistItemDeletedEventActionSchema,
    checklistItemStatusUpdatedEventActionSchema,
    // ---- Member Events ----
    memberAddedToCardEventActionSchema,
    memberRemovedFromCardEventActionSchema,
  ]),
  webhook: _webhookSchema,
})
export type WebhookEventPayload = z.infer<typeof webhookEventPayloadSchema>

/** Fallback schema for unsupported event types */
export const fallbackEventPayloadSchema = z.object({
  action: trelloEventActionSchema.extend({ type: z.string() }),
  webhook: _webhookSchema,
})
