import { wrapActionAndInjectServices } from 'src/utils'

export const getCardsInList = wrapActionAndInjectServices<'getCardsInList'>({
  async action({ input }, { listRepository }) {
    const { listId } = input

    const matchingCards = await listRepository.getCardsInList(listId)
    return { cards: matchingCards }
  },
  errorMessage: 'Failed to retrieve the cards',
})
