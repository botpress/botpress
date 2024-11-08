import { wrapAction } from '../action-wrapper'

export const createCard = wrapAction(
  { actionName: 'createCard' },
  async ({ trelloClient }, { listId, cardName, cardBody, members, labels, dueDate }) => {
    const newCard = await trelloClient.createCard({
      card: { name: cardName, description: cardBody ?? '', listId, memberIds: members, labelIds: labels, dueDate },
    })

    return { message: `Card created successfully. Card ID: ${newCard.id}`, newCardId: newCard.id }
  }
)
