import { TrelloEventType } from 'definitions/events'
import {
  ChecklistAddedToCardEventAction,
  ChecklistItemCreatedEventAction,
  ChecklistItemDeletedEventAction,
  ChecklistItemStatusUpdatedEventAction,
  ChecklistItemUpdatedEventAction,
} from '../schemas/checklist-event-schemas'
import { extractCommonEventData, extractIdAndName } from './helpers'
import * as bp from '.botpress'

const _extractCommonChecklistItemPayload = (
  actionData: ChecklistItemCreatedEventAction | ChecklistItemDeletedEventAction | ChecklistItemStatusUpdatedEventAction
) => ({
  ...extractCommonEventData(actionData),
  board: extractIdAndName(actionData.data.board),
  card: extractIdAndName(actionData.data.card),
  checklist: actionData.data.checklist,
  checklistItem: {
    id: actionData.data.checkItem.id,
    name: actionData.data.checkItem.name,
    isCompleted: actionData.data.checkItem.state === 'complete',
    textData: actionData.data.checkItem.textData,
  },
})

export const handleChecklistAddedToCardEvent = async (
  props: bp.HandlerProps,
  eventType: TrelloEventType.CHECKLIST_ADDED_TO_CARD,
  actionData: ChecklistAddedToCardEventAction
) => {
  return await props.client.createEvent({
    type: eventType,
    payload: {
      ...extractCommonEventData(actionData),
      board: extractIdAndName(actionData.data.board),
      card: extractIdAndName(actionData.data.card),
      checklist: actionData.data.checklist,
    },
  })
}

export const handleChecklistItemCreatedEvent = async (
  props: bp.HandlerProps,
  eventType: TrelloEventType.CHECKLIST_ITEM_CREATED,
  actionData: ChecklistItemCreatedEventAction
) => {
  return await props.client.createEvent({
    type: eventType,
    payload: _extractCommonChecklistItemPayload(actionData),
  })
}

const _mapOldChecklistItemData = (oldData: ChecklistItemUpdatedEventAction['data']['old']) => {
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
  actionData: ChecklistItemUpdatedEventAction
) => {
  return await props.client.createEvent({
    type: eventType,
    payload: {
      ...extractCommonEventData(actionData),
      board: extractIdAndName(actionData.data.board),
      card: extractIdAndName(actionData.data.card),
      checklist: actionData.data.checklist,
      checklistItem: {
        id: actionData.data.checkItem.id,
        name: actionData.data.checkItem.name,
        isCompleted: actionData.data.checkItem.state === 'complete',
        textData: actionData.data.checkItem.textData,
        dueDate: actionData.data.checkItem.due,
        dueDateReminder: actionData.data.checkItem.dueReminder,
      },
      old: _mapOldChecklistItemData(actionData.data.old),
    },
  })
}

export const handleChecklistItemDeletedEvent = async (
  props: bp.HandlerProps,
  eventType: TrelloEventType.CHECKLIST_ITEM_DELETED,
  actionData: ChecklistItemDeletedEventAction
) => {
  return await props.client.createEvent({
    type: eventType,
    payload: _extractCommonChecklistItemPayload(actionData),
  })
}

export const handleChecklistItemStatusUpdatedEvent = async (
  props: bp.HandlerProps,
  eventType: TrelloEventType.CHECKLIST_ITEM_STATUS_UPDATED,
  actionData: ChecklistItemStatusUpdatedEventAction
) => {
  return await props.client.createEvent({
    type: eventType,
    payload: _extractCommonChecklistItemPayload(actionData),
  })
}
