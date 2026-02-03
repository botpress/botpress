import { z } from '@botpress/sdk'
import { trelloIdSchema } from 'definitions/schemas'
import { cardAttachmentAddedWebhookSchema, cardAttachmentRemovedWebhookSchema } from './card-attachment-webhook-schemas'
import {
  commentAddedWebhookSchema,
  commentDeletedWebhookSchema,
  commentUpdatedWebhookSchema,
} from './card-comment-webhook-schemas'
import { cardLabelAddedWebhookSchema, cardLabelRemovedWebhookSchema } from './card-label-webhook-schemas'
import {
  cardCreatedWebhookSchema,
  cardDeletedWebhookSchema,
  cardUpdatedWebhookSchema,
  cardVotesUpdatedWebhookSchema,
} from './card-webhook-schemas'
import {
  checklistAddedToCardWebhookSchema,
  checklistItemCreatedWebhookSchema,
  checklistItemDeletedWebhookSchema,
  checklistItemStatusUpdatedWebhookSchema,
  checklistItemUpdatedWebhookSchema,
} from './checklist-webhook-schemas'
import { trelloWebhookSchema } from './common'
import { memberAddedToCardWebhookSchema, memberRemovedFromCardWebhookSchema } from './member-webhook-schemas'

const _webhookDetailsSchema = z.object({
  id: trelloIdSchema,
  idModel: trelloIdSchema,
  active: z.boolean(),
  consecutiveFailures: z.number().min(0),
})

export const webhookEventPayloadSchema = z.object({
  action: z.union([
    // ---- Card Events ----
    cardCreatedWebhookSchema,
    cardUpdatedWebhookSchema,
    cardDeletedWebhookSchema,
    cardVotesUpdatedWebhookSchema,
    // ---- Card Comment Events ----
    commentAddedWebhookSchema,
    commentUpdatedWebhookSchema,
    commentDeletedWebhookSchema,
    // ---- Card Label Events ----
    cardLabelAddedWebhookSchema,
    cardLabelRemovedWebhookSchema,
    // ---- Card Attachment Events ----
    cardAttachmentAddedWebhookSchema,
    cardAttachmentRemovedWebhookSchema,
    // ---- Checklist Events ----
    checklistAddedToCardWebhookSchema,
    checklistItemCreatedWebhookSchema,
    checklistItemUpdatedWebhookSchema,
    checklistItemDeletedWebhookSchema,
    checklistItemStatusUpdatedWebhookSchema,
    // ---- Member Events ----
    memberAddedToCardWebhookSchema,
    memberRemovedFromCardWebhookSchema,
  ]),
  webhook: _webhookDetailsSchema,
})
export type WebhookEventPayload = z.infer<typeof webhookEventPayloadSchema>

/** Fallback schema for unsupported event types */
export const fallbackEventPayloadSchema = z.object({
  action: trelloWebhookSchema.extend({ type: z.string() }),
  webhook: _webhookDetailsSchema,
})
