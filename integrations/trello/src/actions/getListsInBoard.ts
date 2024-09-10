import { getListsInBoardInputSchema } from 'src/schemas/actions'
import { wrapActionAndInjectServices } from 'src/utils'

export const getListsInBoard = wrapActionAndInjectServices<'getListsInBoard'>({
  async action({ input }, { boardQueryService }) {
    const { boardId } = getListsInBoardInputSchema.parse(input)

    const matchingLists = await boardQueryService.getListsInBoard(boardId)
    return { lists: matchingLists }
  },
  errorMessage: 'Failed to retrieve the lists',
})
