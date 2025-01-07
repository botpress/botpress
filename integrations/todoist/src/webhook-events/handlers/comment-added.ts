import type { WebhookEventHandler } from '../handler-dispatcher'
import type { NoteAddedEvent, Event } from '../schemas'

export const isCommentAddedEvent = (event: Event): event is NoteAddedEvent => event.event_name === 'note:added'

export const handleCommentAddedEvent: WebhookEventHandler<NoteAddedEvent> = async ({
  client,
  event,
  initiatorUserId,
}) => {
  const conversationId = event.event_data.item_id
  const commentId = event.event_data.id
  const { conversation } = await client.getOrCreateConversation({
    channel: 'comments',
    tags: { id: conversationId },
  })

  await client.getOrCreateMessage({
    tags: {
      id: commentId,
    },
    type: 'text',
    userId: initiatorUserId,
    conversationId: conversation.id,
    payload: {
      text: event.event_data.content,
    },
  })
}
