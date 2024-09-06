import { cardListInputSchema } from '../../schemas/actions/interfaces/cardListInputSchema'
import { wrapActionAndInjectServices } from '../../utils'

export const cardList = wrapActionAndInjectServices<'cardList'>({
  async action({ input }, { listRepository }) {
    const { nextToken: listId } = cardListInputSchema.parse(input)
    const items = await listRepository.getCardsInList(listId)

    return { items, meta: {} }
  },
  errorMessage: 'Failed to retrieve the cards',
})
