import { wrapAction } from '../action-wrapper'

export const createCard = wrapAction(
  { actionName: 'createCard' },
  async ({ trelloClient }, { listId, cardName, cardBody }) => {
    const newCard = await trelloClient.createCard({
      card: { name: cardName, description: cardBody ?? '', listId },
    })

    return { message: `Card created successfully. Card ID: ${newCard.id}`, newCardId: newCard.id }
  }
)
