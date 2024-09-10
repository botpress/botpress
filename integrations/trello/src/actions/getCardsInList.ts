import { getCardsInListInputSchema } from 'src/schemas/actions'
import { wrapActionAndInjectServices } from 'src/utils'

export const getCardsInList = wrapActionAndInjectServices<'getCardsInList'>({
  async action({ input }, { listQueryService }) {
    const { listId } = getCardsInListInputSchema.parse(input)

    const matchingCards = await listQueryService.getCardsInList(listId)
    return { cards: matchingCards }
  },
  errorMessage: 'Failed to retrieve the cards',
})
