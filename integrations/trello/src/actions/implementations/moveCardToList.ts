import { printActionTriggeredMsg, getTools } from '../helpers'
import * as bp from '.botpress'

export const moveCardToList: bp.Integration['actions']['moveCardToList'] = async (props) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  const { cardId, newListId } = props.input
  const card = await trelloClient.getCardById({ cardId })
  const newList = await trelloClient.getListById({ listId: newListId })

  await trelloClient.updateCard({ partialCard: { id: card.id, listId: newList.id } })

  return { message: 'Card successfully moved to the new list' }
}
