import { wrapActionAndInjectServices } from 'src/utils'

export const getCardsByDisplayName = wrapActionAndInjectServices<'getCardsByDisplayName'>({
  async action({ input }, { cardQueryService }) {
    const { listId, cardName } = input

    const matchingCards = await cardQueryService.getCardsByDisplayName(listId, cardName)
    return { cards: matchingCards }
  },
  errorMessage: 'Failed to retrieve the cards',
})
