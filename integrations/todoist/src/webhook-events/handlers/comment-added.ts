import { NoteEvent, Event } from '../schemas'
import * as bp from '.botpress'

export const isCommentAddedEvent = (event: Event): event is NoteEvent => event.event_name === 'note:added'

export const handleCommentAddedEvent = async (event: NoteEvent, { client }: bp.HandlerProps) => {
  const conversationId = event.event_data.item_id
  const userId = event.event_data.posted_uid
  const commentId = event.event_data.id
  const { conversation } = await client.getOrCreateConversation({
    channel: 'comments',
    tags: { id: conversationId },
  })

  const { user } = await client.getOrCreateUser({
    tags: { id: userId },
  })

  await client.getOrCreateMessage({
    tags: {
      id: commentId,
    },
    type: 'text',
    userId: user.id,
    conversationId: conversation.id,
    payload: {
      text: event.event_data.content,
    },
  })
}
