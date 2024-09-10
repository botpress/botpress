import { getBoardByIdInputSchema } from 'src/schemas/actions/getBoardByIdInputSchema'
import { wrapActionAndInjectServices } from 'src/utils'

export const getBoardById = wrapActionAndInjectServices<'getBoardById'>({
  async action({ input }, { boardRepository }) {
    const { boardId } = getBoardByIdInputSchema.parse(input)

    const board = await boardRepository.getBoardById(boardId)
    return { board }
  },
  errorMessage: 'Failed to retrieve the board',
})
