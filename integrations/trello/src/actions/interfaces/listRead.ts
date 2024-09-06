import { listReadInputSchema } from 'src/schemas/actions/interfaces/listReadInputSchema'
import { wrapActionAndInjectServices } from '../../utils'

export const listRead = wrapActionAndInjectServices<'listRead'>({
  async action({ input }, { listRepository }) {
    const { id: listId } = listReadInputSchema.parse(input)
    const item = await listRepository.getListById(listId)

    return { item, meta: {} }
  },
  errorMessage: 'Failed to retrieve the list',
})
