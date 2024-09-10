import { wrapActionAndInjectServices } from 'src/utils'

export const getAllBoards = wrapActionAndInjectServices<'getAllBoards'>({
  async action({}, { boardRepository }) {
    const boards = await boardRepository.getAllBoards()
    return { boards }
  },
  errorMessage: 'Failed to retrieve the list of all boards',
})
