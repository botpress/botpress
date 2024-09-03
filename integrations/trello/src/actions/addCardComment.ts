import { ICardCommentCreationService } from 'src/interfaces/services/ICardCommentCreationService'
import { getContainer, DIToken } from 'src/iocContainer'
import { addCardCommentInputSchema } from 'src/schemas/actions'
import { wrapWithTryCatch } from 'src/utils'
import * as bp from '../../.botpress'

export const addCardComment: bp.IntegrationProps['actions']['addCardComment'] = async ({ ctx, input }) => {
  const container = getContainer(ctx)
  const cardCommentCreationService = container.resolve<ICardCommentCreationService>(DIToken.CardCommentCreationService)
  const { cardId, commentBody } = addCardCommentInputSchema.parse(input)

  const newCommentId = await cardCommentCreationService.createComment(cardId, commentBody)

  return { message: 'Comment successfully added to the card', newCommentId }
}

export default wrapWithTryCatch(addCardComment, 'Failed to add a comment to the card')
