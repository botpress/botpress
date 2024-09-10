import { getAllBoardMembersInputSchema } from 'src/schemas/actions'
import { wrapActionAndInjectServices } from 'src/utils'

export const getAllBoardMembers = wrapActionAndInjectServices<'getAllBoardMembers'>({
  async action({ input }, { boardRepository }) {
    const { boardId } = getAllBoardMembersInputSchema.parse(input)

    const members = await boardRepository.getBoardMembers(boardId)
    return { members }
  },
  errorMessage: 'Failed to retrieve the members of the board',
})
