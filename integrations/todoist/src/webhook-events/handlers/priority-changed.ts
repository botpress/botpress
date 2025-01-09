import { ResponseMapping } from 'src/todoist-api/mapping'
import type { WebhookEventHandler } from '../handler-dispatcher'
import type { ItemUpdatedEvent, Event } from '../schemas'

export const isPriorityChangedEvent = (event: Event): event is ItemUpdatedEvent =>
  event.event_name === 'item:updated' &&
  event.event_data_extra?.update_intent === 'item_updated' &&
  event.event_data_extra?.old_item?.priority !== event.event_data.priority

export const handlePriorityChangedEvent: WebhookEventHandler<ItemUpdatedEvent> = async ({
  event,
  client,
  initiatorUserId,
}) => {
  const newPriority = event.event_data.priority
  const oldPriority = event.event_data_extra?.old_item.priority

  const { conversation } = await client.getOrCreateConversation({
    channel: 'comments',
    tags: { id: event.event_data.id },
  })

  if (newPriority !== oldPriority) {
    await client.createEvent({
      type: 'taskPriorityChanged',
      payload: {
        id: event.event_data.id,
        newPriority: ResponseMapping.mapPriority(newPriority),
        oldPriority: oldPriority ? ResponseMapping.mapPriority(oldPriority) : undefined,
      },
      conversationId: conversation.id,
      userId: initiatorUserId,
    })
  }
}
