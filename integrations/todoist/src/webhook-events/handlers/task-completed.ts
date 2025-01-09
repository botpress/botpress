import { ResponseMapping } from 'src/todoist-api/mapping'
import type { WebhookEventHandler } from '../handler-dispatcher'
import type { ItemCompletedEvent, Event } from '../schemas'

export const isTaskCompletedEvent = (event: Event): event is ItemCompletedEvent => event.event_name === 'item:completed'

export const handleTaskCompletedEvent: WebhookEventHandler<ItemCompletedEvent> = async ({
  event,
  client,
  initiatorUserId,
}) => {
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
      priority: ResponseMapping.mapPriority(event.event_data.priority),
    },
    conversationId: conversation.id,
    userId: initiatorUserId,
  })
}
