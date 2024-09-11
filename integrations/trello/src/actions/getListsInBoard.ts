import { wrapActionAndInjectServices } from 'src/utils'

export const getListsInBoard = wrapActionAndInjectServices<'getListsInBoard'>({
  async action({ input }, { boardRepository }) {
    const { boardId } = input

    const matchingLists = await boardRepository.getListsInBoard(boardId)
    return { lists: matchingLists }
  },
  errorMessage: 'Failed to retrieve the lists',
})
