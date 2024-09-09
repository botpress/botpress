import { boardReadInputSchema } from 'src/schemas/actions/interfaces/boardReadInputSchema'
import { wrapActionAndInjectServices } from '../../utils'

export const boardRead = wrapActionAndInjectServices<'boardRead'>({
  async action({ input }, { boardRepository }) {
    const { id: boardId } = boardReadInputSchema.parse(input)
    const item = await boardRepository.getBoardById(boardId)

    return { item, meta: {} }
  },
  errorMessage: 'Failed to retrieve the board',
})
