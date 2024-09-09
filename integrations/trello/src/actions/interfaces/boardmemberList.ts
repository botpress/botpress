import { boardmemberListInputSchema } from '../../schemas/actions/interfaces/boardmemberListInputSchema'
import { wrapActionAndInjectServices } from '../../utils'

export const boardmemberList = wrapActionAndInjectServices<'boardmemberList'>({
  async action({ input }, { boardRepository }) {
    const { nextToken: boardId } = boardmemberListInputSchema.parse(input)
    const items = await boardRepository.getBoardMembers(boardId)

    return { items, meta: {} }
  },
  errorMessage: 'Failed to retrieve the board members',
})
