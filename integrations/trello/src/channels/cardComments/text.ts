import assert from 'assert'
import { ICardCommentCreationService } from 'src/interfaces/services/ICardCommentCreationService'
import { DIToken, getContainer } from 'src/iocContainer'
import * as bp from '../../../.botpress'

export const textMessagePublish = async ({
  ctx,
  conversation,
  ack,
  payload,
  client,
}: bp.MessageProps['cardComments']['text']) => {
  const container = getContainer(ctx)
  const cardCommentCreationService = container.resolve<ICardCommentCreationService>(DIToken.CardCommentCreationService)

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
