import { ResponseMapping } from 'src/todoist-api/mapping'
import type { WebhookEventHandler } from '../handler-dispatcher'
import type { ItemAddedEvent, Event } from '../schemas'

export const isTaskCreatedEvent = (event: Event): event is ItemAddedEvent => event.event_name === 'item:added'

export const handleTaskCreatedEvent: WebhookEventHandler<ItemAddedEvent> = async ({
  event,
  client,
  initiatorUserId,
}) => {
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
      priority: ResponseMapping.mapPriority(event.event_data.priority),
    },
    conversationId: conversation.id,
    userId: initiatorUserId,
  })
}
