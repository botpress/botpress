import { TrelloEventType } from 'definitions/events'
import {
  CardCreatedWebhook,
  CardDeletedWebhook,
  CardUpdatedWebhook,
  CardVotesUpdatedWebhook,
} from '../schemas/card-webhook-schemas'
import { extractCommonEventData, extractIdAndName, extractIdAndNameIfExists } from './helpers'
import { Expect, IsWebhookHandler } from './types'
import * as bp from '.botpress'

export const handleCardCreatedEvent = async (
  props: bp.HandlerProps,
  eventType: TrelloEventType.CARD_CREATED,
  webhookEvent: CardCreatedWebhook
) => {
  return await props.client.createEvent({
    type: eventType,
    payload: {
      ...extractCommonEventData(webhookEvent),
      board: extractIdAndName(webhookEvent.data.board),
      list: extractIdAndName(webhookEvent.data.list),
      card: extractIdAndName(webhookEvent.data.card),
    },
  })
}
type _HandleCardCreatedEventTest = Expect<IsWebhookHandler<typeof handleCardCreatedEvent>>

export const handleCardUpdatedEvent = async (
  props: bp.HandlerProps,
  eventType: TrelloEventType.CARD_UPDATED,
  webhookEvent: CardUpdatedWebhook
) => {
  return await props.client.createEvent({
    type: eventType,
    payload: {
      ...extractCommonEventData(webhookEvent),
      board: extractIdAndName(webhookEvent.data.board),
      card: webhookEvent.data.card,
      old: webhookEvent.data.old,
      list: extractIdAndNameIfExists(webhookEvent.data.list),
      listBefore: extractIdAndNameIfExists(webhookEvent.data.listBefore),
      listAfter: extractIdAndNameIfExists(webhookEvent.data.listAfter),
    },
  })
}
type _HandleCardUpdatedEventTest = Expect<IsWebhookHandler<typeof handleCardUpdatedEvent>>

export const handleCardDeletedEvent = async (
  props: bp.HandlerProps,
  eventType: TrelloEventType.CARD_DELETED,
  webhookEvent: CardDeletedWebhook
) => {
  return await props.client.createEvent({
    type: eventType,
    payload: {
      ...extractCommonEventData(webhookEvent),
      board: extractIdAndName(webhookEvent.data.board),
      list: extractIdAndName(webhookEvent.data.list),
      card: {
        id: webhookEvent.data.card.id,
      },
    },
  })
}
type _HandleCardDeletedEventTest = Expect<IsWebhookHandler<typeof handleCardDeletedEvent>>

export const handleCardVotesUpdatedEvent = async (
  props: bp.HandlerProps,
  eventType: TrelloEventType.CARD_VOTES_UPDATED,
  webhookEvent: CardVotesUpdatedWebhook
) => {
  return await props.client.createEvent({
    type: eventType,
    payload: {
      ...extractCommonEventData(webhookEvent),
      board: extractIdAndName(webhookEvent.data.board),
      card: extractIdAndName(webhookEvent.data.card),
      voted: webhookEvent.data.voted,
    },
  })
}
type _HandleCardVotesUpdatedEventTest = Expect<IsWebhookHandler<typeof handleCardVotesUpdatedEvent>>
