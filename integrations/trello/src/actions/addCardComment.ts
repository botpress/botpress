import { wrapActionAndInjectServices } from 'src/utils'

export const addCardComment = wrapActionAndInjectServices<'addCardComment'>({
  async action({ input }, { cardCommentRepository }) {
    const { cardId, commentBody } = input

    const newCommentId = await cardCommentRepository.createComment(cardId, commentBody)

    return { message: 'Comment successfully added to the card', newCommentId }
  },
  errorMessage: 'Failed to add a comment to the card',
})
