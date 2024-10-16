import assert from 'assert'
import { getServices } from 'src/services'
import * as bp from '../../../.botpress'

export const textMessagePublish = async ({
  ctx,
  conversation,
  ack,
  payload,
  client,
}: bp.MessageProps['cardComments']['text']) => {
  const { cardCommentRepository } = getServices(ctx)

  assert(conversation.tags.cardId, 'Card id must be set')

  const commentId = await cardCommentRepository.createComment(conversation.tags.cardId, payload.text)

  await client.updateConversation({
    id: conversation.id,
    tags: {
      lastCommentId: commentId,
    },
  })

  await ack({ tags: { commentId } })
}
