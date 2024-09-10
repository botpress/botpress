import { getCardsByDisplayNameInputSchema } from 'src/schemas/actions'
import { wrapActionAndInjectServices } from 'src/utils'

export const getCardsByDisplayName = wrapActionAndInjectServices<'getCardsByDisplayName'>({
  async action({ input }, { cardQueryService }) {
    const { listId, cardName } = getCardsByDisplayNameInputSchema.parse(input)

    const matchingCards = await cardQueryService.getCardsByDisplayName(listId, cardName)
    return { cards: matchingCards }
  },
  errorMessage: 'Failed to retrieve the cards',
})
