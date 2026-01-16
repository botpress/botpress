import { TrelloEventType } from 'definitions/events'
import {
  CardAttachmentAddedEventAction,
  CardAttachmentRemovedEventAction,
} from '../schemas/card-attachment-event-schemas'
import { extractCommonEventData, extractIdAndName } from './helpers'
import * as bp from '.botpress'

export const handleAttachmentAddedEvent = async (
  props: bp.HandlerProps,
  eventType: TrelloEventType.ATTACHMENT_ADDED_TO_CARD,
  actionData: CardAttachmentAddedEventAction
) => {
  return await props.client.createEvent({
    type: eventType,
    payload: {
      ...extractCommonEventData(actionData),
      board: extractIdAndName(actionData.data.board),
      list: extractIdAndName(actionData.data.list),
      card: extractIdAndName(actionData.data.card),
      attachment: actionData.data.attachment,
    },
  })
}

export const handleAttachmentRemovedEvent = async (
  props: bp.HandlerProps,
  eventType: TrelloEventType.ATTACHMENT_REMOVED_FROM_CARD,
  actionData: CardAttachmentRemovedEventAction
) => {
  return await props.client.createEvent({
    type: eventType,
    payload: {
      ...extractCommonEventData(actionData),
      board: extractIdAndName(actionData.data.board),
      card: extractIdAndName(actionData.data.card),
      attachment: actionData.data.attachment,
    },
  })
}
