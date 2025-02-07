import { nameCompare } from 'src/string-utils'
import { wrapAction } from '../action-wrapper'

export const getCardsByDisplayName = wrapAction(
  { actionName: 'getCardsByDisplayName' },
  async ({ trelloClient }, { listId, cardName }) => {
    const cards = await trelloClient.getCardsInList({ listId })
    const matchingCards = cards.filter((c) => nameCompare(c.name, cardName))

    return { cards: matchingCards }
  }
)
