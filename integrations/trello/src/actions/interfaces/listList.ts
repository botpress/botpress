import { listListInputSchema } from 'src/schemas/actions/interfaces/listListInputSchema'
import { wrapActionAndInjectServices } from '../../utils'

export const listList = wrapActionAndInjectServices<'listList'>({
  async action({ input }, { boardRepository }) {
    const { nextToken: boardId } = listListInputSchema.parse(input)
    const items = await boardRepository.getListsInBoard(boardId)

    return { items, meta: {} }
  },
  errorMessage: 'Failed to retrieve the lists',
})
