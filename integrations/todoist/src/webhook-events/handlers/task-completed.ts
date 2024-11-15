import { ItemCompletedEvent, Event } from '../schemas'
import * as bp from '.botpress'

export const isTaskCompletedEvent = (event: Event): event is ItemCompletedEvent => event.event_name === 'item:completed'

export const handleTaskCompletedEvent = async (event: ItemCompletedEvent, { client }: bp.HandlerProps) => {
  const { conversation } = await client.getOrCreateConversation({
    channel: 'comments',
    tags: { id: event.event_data.id },
  })

  await client.createEvent({
    type: 'taskCompleted',
    payload: {
      id: event.event_data.id,
      user_id: event.event_data.user_id,
      content: event.event_data.content,
      description: event.event_data.description,
      priority: event.event_data.priority,
    },
    conversationId: conversation.id,
  })
}
