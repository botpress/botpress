import { TrelloEventType } from 'definitions/events'
import {
  CardCreatedEventAction,
  CardDeletedEventAction,
  CardUpdatedEventAction,
  CardVotesUpdatedEventAction,
} from '../schemas/card-event-schemas'
import { extractCommonEventData, extractIdAndName, extractIdAndNameIfExists } from './helpers'
import * as bp from '.botpress'

export const handleCardCreatedEvent = async (
  props: bp.HandlerProps,
  eventType: TrelloEventType.CARD_CREATED,
  actionData: CardCreatedEventAction
) => {
  return await props.client.createEvent({
    type: eventType,
    payload: {
      ...extractCommonEventData(actionData),
      board: extractIdAndName(actionData.data.board),
      list: extractIdAndName(actionData.data.list),
      card: extractIdAndName(actionData.data.card),
    },
  })
}

export const handleCardUpdatedEvent = async (
  props: bp.HandlerProps,
  eventType: TrelloEventType.CARD_UPDATED,
  actionData: CardUpdatedEventAction
) => {
  return await props.client.createEvent({
    type: eventType,
    payload: {
      ...extractCommonEventData(actionData),
      board: extractIdAndName(actionData.data.board),
      card: actionData.data.card,
      old: actionData.data.old,
      list: extractIdAndNameIfExists(actionData.data.list),
      listBefore: extractIdAndNameIfExists(actionData.data.listBefore),
      listAfter: extractIdAndNameIfExists(actionData.data.listAfter),
    },
  })
}

export const handleCardDeletedEvent = async (
  props: bp.HandlerProps,
  eventType: TrelloEventType.CARD_DELETED,
  actionData: CardDeletedEventAction
) => {
  return await props.client.createEvent({
    type: eventType,
    payload: {
      ...extractCommonEventData(actionData),
      board: extractIdAndName(actionData.data.board),
      list: extractIdAndName(actionData.data.list),
      card: {
        id: actionData.data.card.id,
      },
    },
  })
}

export const handleCardVotesUpdatedEvent = async (
  props: bp.HandlerProps,
  eventType: TrelloEventType.CARD_VOTES_UPDATED,
  actionData: CardVotesUpdatedEventAction
) => {
  return await props.client.createEvent({
    type: eventType,
    payload: {
      ...extractCommonEventData(actionData),
      board: extractIdAndName(actionData.data.board),
      card: extractIdAndName(actionData.data.card),
      voted: actionData.data.voted,
    },
  })
}
