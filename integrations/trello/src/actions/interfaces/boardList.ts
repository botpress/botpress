import { wrapActionAndInjectServices } from '../../utils'

export const boardList = wrapActionAndInjectServices<'boardList'>({
  async action({}, { boardRepository }) {
    const items = await boardRepository.getAllBoards()

    return { items, meta: {} }
  },
  errorMessage: 'Failed to retrieve the boards',
})
