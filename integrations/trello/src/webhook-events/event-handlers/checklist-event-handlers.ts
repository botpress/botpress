import { TrelloEventType } from 'definitions/events'
import {
  ChecklistAddedToCardWebhook,
  ChecklistItemCreatedWebhook,
  ChecklistItemDeletedWebhook,
  ChecklistItemStatusUpdatedWebhook,
  ChecklistItemUpdatedWebhook,
} from '../schemas/checklist-webhook-schemas'
import { extractCommonEventData, extractIdAndName } from './helpers'
import { Expect, IsWebhookHandler } from './types'
import * as bp from '.botpress'

const _extractCommonChecklistItemPayload = (
  webhookEvent: ChecklistItemCreatedWebhook | ChecklistItemDeletedWebhook | ChecklistItemStatusUpdatedWebhook
) => ({
  ...extractCommonEventData(webhookEvent),
  board: extractIdAndName(webhookEvent.data.board),
  card: extractIdAndName(webhookEvent.data.card),
  checklist: webhookEvent.data.checklist,
  checklistItem: {
    id: webhookEvent.data.checkItem.id,
    name: webhookEvent.data.checkItem.name,
    isCompleted: webhookEvent.data.checkItem.state === 'complete',
    textData: webhookEvent.data.checkItem.textData,
  },
})

export const handleChecklistAddedToCardEvent = async (
  props: bp.HandlerProps,
  eventType: TrelloEventType.CHECKLIST_ADDED_TO_CARD,
  webhookEvent: ChecklistAddedToCardWebhook
) => {
  return await props.client.createEvent({
    type: eventType,
    payload: {
      ...extractCommonEventData(webhookEvent),
      board: extractIdAndName(webhookEvent.data.board),
      card: extractIdAndName(webhookEvent.data.card),
      checklist: webhookEvent.data.checklist,
    },
  })
}
type _HandleChecklistAddedToCardEventTest = Expect<IsWebhookHandler<typeof handleChecklistAddedToCardEvent>>

export const handleChecklistItemCreatedEvent = async (
  props: bp.HandlerProps,
  eventType: TrelloEventType.CHECKLIST_ITEM_CREATED,
  webhookEvent: ChecklistItemCreatedWebhook
) => {
  return await props.client.createEvent({
    type: eventType,
    payload: _extractCommonChecklistItemPayload(webhookEvent),
  })
}
type _HandleChecklistItemCreatedEventTest = Expect<IsWebhookHandler<typeof handleChecklistItemCreatedEvent>>

const _mapOldChecklistItemData = (oldData: ChecklistItemUpdatedWebhook['data']['old']) => {
  const { name, state, textData, dueReminder, due } = oldData
  return {
    name,
    isCompleted: state !== undefined ? state === 'complete' : undefined,
    textData,
    dueDate: due,
    dueDateReminder: dueReminder,
  }
}

export const handleChecklistItemUpdatedEvent = async (
  props: bp.HandlerProps,
  eventType: TrelloEventType.CHECKLIST_ITEM_UPDATED,
  webhookEvent: ChecklistItemUpdatedWebhook
) => {
  return await props.client.createEvent({
    type: eventType,
    payload: {
      ...extractCommonEventData(webhookEvent),
      board: extractIdAndName(webhookEvent.data.board),
      card: extractIdAndName(webhookEvent.data.card),
      checklist: webhookEvent.data.checklist,
      checklistItem: {
        id: webhookEvent.data.checkItem.id,
        name: webhookEvent.data.checkItem.name,
        isCompleted: webhookEvent.data.checkItem.state === 'complete',
        textData: webhookEvent.data.checkItem.textData,
        dueDate: webhookEvent.data.checkItem.due,
        dueDateReminder: webhookEvent.data.checkItem.dueReminder,
      },
      old: _mapOldChecklistItemData(webhookEvent.data.old),
    },
  })
}
type _HandleChecklistItemUpdatedEventTest = Expect<IsWebhookHandler<typeof handleChecklistItemUpdatedEvent>>

export const handleChecklistItemDeletedEvent = async (
  props: bp.HandlerProps,
  eventType: TrelloEventType.CHECKLIST_ITEM_DELETED,
  webhookEvent: ChecklistItemDeletedWebhook
) => {
  return await props.client.createEvent({
    type: eventType,
    payload: _extractCommonChecklistItemPayload(webhookEvent),
  })
}
type _HandleChecklistItemDeletedEventTest = Expect<IsWebhookHandler<typeof handleChecklistItemDeletedEvent>>

export const handleChecklistItemStatusUpdatedEvent = async (
  props: bp.HandlerProps,
  eventType: TrelloEventType.CHECKLIST_ITEM_STATUS_UPDATED,
  webhookEvent: ChecklistItemStatusUpdatedWebhook
) => {
  return await props.client.createEvent({
    type: eventType,
    payload: _extractCommonChecklistItemPayload(webhookEvent),
  })
}
type _HandleChecklistItemStatusUpdatedEventTest = Expect<IsWebhookHandler<typeof handleChecklistItemStatusUpdatedEvent>>
