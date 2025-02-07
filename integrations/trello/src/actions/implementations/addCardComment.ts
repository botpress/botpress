import { wrapAction } from '../action-wrapper'

export const addCardComment = wrapAction(
  { actionName: 'addCardComment' },
  async ({ trelloClient }, { cardId, commentBody }) => {
    const newCommentId = await trelloClient.addCardComment({ cardId, commentBody })

    return { message: 'Comment successfully added to the card', newCommentId }
  }
)
