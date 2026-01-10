import { printActionTriggeredMsg, getTools } from '../helpers'
import * as bp from '.botpress'

export const getCardsInList: bp.Integration['actions']['getCardsInList'] = async (props) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  const { listId } = props.input
  const matchingCards = await trelloClient.getCardsInList({ listId })

  return { cards: matchingCards }
}
