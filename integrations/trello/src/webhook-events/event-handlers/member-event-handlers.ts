import { TrelloEventType } from 'definitions/events'
import { MemberAddedToCardEventAction, MemberRemovedFromCardEventAction } from '../schemas/member-event-schemas'
import { extractCommonEventData, extractIdAndName } from './helpers'
import * as bp from '.botpress'

export const handleMemberAddedToCardEvent = async (
  props: bp.HandlerProps,
  eventType: TrelloEventType.MEMBER_ADDED_TO_CARD,
  actionData: MemberAddedToCardEventAction
) => {
  return await props.client.createEvent({
    type: eventType,
    payload: {
      ...extractCommonEventData(actionData),
      board: extractIdAndName(actionData.data.board),
      card: extractIdAndName(actionData.data.card),
      member: extractIdAndName(actionData.data.member),
    },
  })
}

export const handleMemberRemovedFromCardEvent = async (
  props: bp.HandlerProps,
  eventType: TrelloEventType.MEMBER_REMOVED_FROM_CARD,
  actionData: MemberRemovedFromCardEventAction
) => {
  return await props.client.createEvent({
    type: eventType,
    payload: {
      ...extractCommonEventData(actionData),
      board: extractIdAndName(actionData.data.board),
      card: extractIdAndName(actionData.data.card),
      member: {
        ...extractIdAndName(actionData.data.member),
        deactivated: actionData.deactivated,
      },
    },
  })
}
