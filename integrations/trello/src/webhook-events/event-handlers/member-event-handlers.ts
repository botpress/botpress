import { TrelloEventType } from 'definitions/events'
import { MemberAddedToCardWebhook, MemberRemovedFromCardWebhook } from '../schemas/member-webhook-schemas'
import { extractCommonEventData, extractIdAndName } from './helpers'
import { Expect, IsWebhookHandler } from './types'
import * as bp from '.botpress'

export const handleMemberAddedToCardEvent = async (
  props: bp.HandlerProps,
  eventType: TrelloEventType.MEMBER_ADDED_TO_CARD,
  webhookEvent: MemberAddedToCardWebhook
) => {
  return await props.client.createEvent({
    type: eventType,
    payload: {
      ...extractCommonEventData(webhookEvent),
      board: extractIdAndName(webhookEvent.data.board),
      card: extractIdAndName(webhookEvent.data.card),
      member: extractIdAndName(webhookEvent.data.member),
    },
  })
}
type _HandleMemberAddedToCardEventTest = Expect<IsWebhookHandler<typeof handleMemberAddedToCardEvent>>

export const handleMemberRemovedFromCardEvent = async (
  props: bp.HandlerProps,
  eventType: TrelloEventType.MEMBER_REMOVED_FROM_CARD,
  webhookEvent: MemberRemovedFromCardWebhook
) => {
  return await props.client.createEvent({
    type: eventType,
    payload: {
      ...extractCommonEventData(webhookEvent),
      board: extractIdAndName(webhookEvent.data.board),
      card: extractIdAndName(webhookEvent.data.card),
      member: {
        ...extractIdAndName(webhookEvent.data.member),
        deactivated: webhookEvent.data.deactivated,
      },
    },
  })
}
type _HandleMemberRemovedFromCardEventTest = Expect<IsWebhookHandler<typeof handleMemberRemovedFromCardEvent>>
