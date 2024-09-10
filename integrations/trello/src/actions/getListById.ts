import { getListByIdInputSchema } from 'src/schemas/actions/getListByIdInputSchema'
import { wrapActionAndInjectServices } from 'src/utils'

export const getListById = wrapActionAndInjectServices<'getListById'>({
  async action({ input }, { listQueryService }) {
    const { listId } = getListByIdInputSchema.parse(input)

    const list = await listQueryService.getListById(listId)
    return { list }
  },
  errorMessage: 'Failed to retrieve the list',
})
