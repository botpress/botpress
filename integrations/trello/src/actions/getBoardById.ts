import { wrapActionAndInjectServices } from 'src/utils'

export const getBoardById = wrapActionAndInjectServices<'getBoardById'>({
  async action({ input }, { boardRepository }) {
    const { boardId } = input

    const board = await boardRepository.getBoardById(boardId)
    return { board }
  },
  errorMessage: 'Failed to retrieve the board',
})
