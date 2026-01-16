import { TrelloEventType } from 'definitions/events'
import { CardLabelAddedEventAction, CardLabelRemovedEventAction } from '../schemas/card-label-event-schemas'
import { extractCommonEventData, extractIdAndName } from './helpers'
import * as bp from '.botpress'

const _handleLabelChangedEvent = async (
  props: bp.HandlerProps,
  eventType: TrelloEventType.LABEL_ADDED_TO_CARD | TrelloEventType.LABEL_REMOVED_FROM_CARD,
  actionData: CardLabelAddedEventAction | CardLabelRemovedEventAction
) => {
  return await props.client.createEvent({
    type: eventType,
    payload: {
      ...extractCommonEventData(actionData),
      board: extractIdAndName(actionData.data.board),
      card: extractIdAndName(actionData.data.card),
      label: actionData.data.label,
    },
  })
}

export const handleLabelAddedToCardEvent = async (
  props: bp.HandlerProps,
  eventType: TrelloEventType.LABEL_ADDED_TO_CARD,
  actionData: CardLabelAddedEventAction
) => {
  return await _handleLabelChangedEvent(props, eventType, actionData)
}

export const handleLabelRemovedFromCardEvent = async (
  props: bp.HandlerProps,
  eventType: TrelloEventType.LABEL_REMOVED_FROM_CARD,
  actionData: CardLabelRemovedEventAction
) => {
  return await _handleLabelChangedEvent(props, eventType, actionData)
}
