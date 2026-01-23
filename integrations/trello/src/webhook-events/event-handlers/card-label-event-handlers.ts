import { TrelloEventType } from 'definitions/events'
import { CardLabelAddedWebhook, CardLabelRemovedWebhook } from '../schemas/card-label-webhook-schemas'
import { extractCommonEventData, extractIdAndName } from './helpers'
import { Expect, IsWebhookHandler } from './types'
import * as bp from '.botpress'

const _handleLabelChangedEvent = async (
  props: bp.HandlerProps,
  eventType: TrelloEventType.LABEL_ADDED_TO_CARD | TrelloEventType.LABEL_REMOVED_FROM_CARD,
  webhookEvent: CardLabelAddedWebhook | CardLabelRemovedWebhook
) => {
  return await props.client.createEvent({
    type: eventType,
    payload: {
      ...extractCommonEventData(webhookEvent),
      board: extractIdAndName(webhookEvent.data.board),
      card: extractIdAndName(webhookEvent.data.card),
      label: webhookEvent.data.label,
    },
  })
}

export const handleLabelAddedToCardEvent = async (
  props: bp.HandlerProps,
  eventType: TrelloEventType.LABEL_ADDED_TO_CARD,
  webhookEvent: CardLabelAddedWebhook
) => {
  return await _handleLabelChangedEvent(props, eventType, webhookEvent)
}
type _HandleLabelAddedToCardEventTest = Expect<IsWebhookHandler<typeof handleLabelAddedToCardEvent>>

export const handleLabelRemovedFromCardEvent = async (
  props: bp.HandlerProps,
  eventType: TrelloEventType.LABEL_REMOVED_FROM_CARD,
  webhookEvent: CardLabelRemovedWebhook
) => {
  return await _handleLabelChangedEvent(props, eventType, webhookEvent)
}
type _HandleLabelRemovedFromCardEventTest = Expect<IsWebhookHandler<typeof handleLabelRemovedFromCardEvent>>
