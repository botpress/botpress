import { wrapAction } from '../action-wrapper'

export const moveCardToList = wrapAction(
  { actionName: 'moveCardToList' },
  async ({ trelloClient }, { cardId, newListId }) => {
    const card = await trelloClient.getCardById({ cardId })
    const newList = await trelloClient.getListById({ listId: newListId })

    await trelloClient.updateCard({ partialCard: { id: card.id, listId: newList.id } })

    return { message: 'Card successfully moved to the new list' }
  }
)
