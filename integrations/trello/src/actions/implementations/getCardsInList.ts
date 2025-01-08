import { wrapAction } from '../action-wrapper'

export const getCardsInList = wrapAction({ actionName: 'getCardsInList' }, async ({ trelloClient }, { listId }) => {
  const matchingCards = await trelloClient.getCardsInList({ listId })

  return { cards: matchingCards }
})
