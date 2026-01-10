import { printActionTriggeredMsg, getTools } from '../helpers'
import * as bp from '.botpress'

export const createCard: bp.Integration['actions']['createCard'] = async (props) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  const { listId, cardName, cardBody, members, labels, dueDate } = props.input
  const newCard = await trelloClient.createCard({
    card: { name: cardName, description: cardBody ?? '', listId, memberIds: members, labelIds: labels, dueDate },
  })

  return { message: `Card created successfully. Card ID: ${newCard.id}`, newCardId: newCard.id }
}
