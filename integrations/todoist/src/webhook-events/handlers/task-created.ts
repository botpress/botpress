import { ItemAddedEvent, Event } from '../schemas'
import * as bp from '.botpress'

export const isTaskCreatedEvent = (event: Event): event is ItemAddedEvent => event.event_name === 'item:added'

export const handleTaskCreatedEvent = async (event: ItemAddedEvent, { client }: bp.HandlerProps) => {
  const { conversation } = await client.getOrCreateConversation({
    channel: 'comments',
    tags: { id: event.event_data.id },
  })

  await client.createEvent({
    type: 'taskAdded',
    payload: {
      id: event.event_data.id,
      content: event.event_data.content,
      description: event.event_data.description,
      priority: event.event_data.priority,
    },
    conversationId: conversation.id,
  })
}
