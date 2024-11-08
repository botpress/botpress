import * as sdk from '@botpress/sdk'
import { wrapChannel } from '../channel-wrapper'

export namespace CardCommentPublisher {
  export const publishTextMessage = wrapChannel(
    { channelName: 'cardComments', messageType: 'text' },
    async ({ trelloClient, conversation, ack, payload, client }) => {
      if (!conversation.tags.cardId) {
        throw new sdk.RuntimeError('Card id must be set')
      }

      const commentId = await trelloClient.addCardComment({
        cardId: conversation.tags.cardId,
        commentBody: payload.text,
      })

      await client.updateConversation({
        id: conversation.id,
        tags: {
          lastCommentId: commentId,
        },
      })

      await ack({ tags: { commentId } })
    }
  )
}
