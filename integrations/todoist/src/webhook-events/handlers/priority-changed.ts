import { ResponseMapping } from 'src/todoist-api/mapping'
import { ItemUpdatedEvent, Event } from '../schemas'
import * as bp from '.botpress'

export const isPriorityChangedEvent = (event: Event): event is ItemUpdatedEvent => event.event_name === 'item:updated'

export const handlePriorityChangedEvent = async (event: ItemUpdatedEvent, { client }: bp.HandlerProps) => {
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
    })
  }
}
