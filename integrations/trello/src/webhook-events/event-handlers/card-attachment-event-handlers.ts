import { TrelloEventType } from 'definitions/events'
import { CardAttachmentAddedWebhook, CardAttachmentRemovedWebhook } from '../schemas/card-attachment-webhook-schemas'
import { extractCommonEventData, extractIdAndName } from './helpers'
import { Expect, IsWebhookHandler } from './types'
import * as bp from '.botpress'

export const handleAttachmentAddedEvent = async (
  props: bp.HandlerProps,
  eventType: TrelloEventType.ATTACHMENT_ADDED_TO_CARD,
  webhookEvent: CardAttachmentAddedWebhook
) => {
  return await props.client.createEvent({
    type: eventType,
    payload: {
      ...extractCommonEventData(webhookEvent),
      board: extractIdAndName(webhookEvent.data.board),
      list: extractIdAndName(webhookEvent.data.list),
      card: extractIdAndName(webhookEvent.data.card),
      attachment: webhookEvent.data.attachment,
    },
  })
}
type _HandleAttachmentAddedEventTest = Expect<IsWebhookHandler<typeof handleAttachmentAddedEvent>>

export const handleAttachmentRemovedEvent = async (
  props: bp.HandlerProps,
  eventType: TrelloEventType.ATTACHMENT_REMOVED_FROM_CARD,
  webhookEvent: CardAttachmentRemovedWebhook
) => {
  return await props.client.createEvent({
    type: eventType,
    payload: {
      ...extractCommonEventData(webhookEvent),
      board: extractIdAndName(webhookEvent.data.board),
      card: extractIdAndName(webhookEvent.data.card),
      attachment: webhookEvent.data.attachment,
    },
  })
}
type _HandleAttachmentRemovedEventTest = Expect<IsWebhookHandler<typeof handleAttachmentRemovedEvent>>
