import assert from 'assert'
import { getServices } from 'src/iocContainer'
import * as bp from '../../../.botpress'

export const textMessagePublish = async ({
  ctx,
  conversation,
  ack,
  payload,
  client,
}: bp.MessageProps['cardComments']['text']) => {
  const { cardCommentCreationService } = getServices(ctx)

  assert(conversation.tags.cardId, 'Card id must be set')

  const commentId = await cardCommentCreationService.createComment(conversation.tags.cardId, payload.text)

  await client.updateConversation({
    id: conversation.id,
    tags: {
      lastCommentId: commentId,
    },
  })

  await ack({ tags: { commentId } })
}
