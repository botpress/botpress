import { nameCompare } from 'src/string-utils'
import { getTools, printActionTriggeredMsg } from '../helpers'
import * as bp from '.botpress'

export const getCardsByDisplayName: bp.Integration['actions']['getCardsByDisplayName'] = async (props) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  const { listId, cardName } = props.input
  const cards = await trelloClient.getCardsInList({ listId })
  const matchingCards = cards.filter((c) => nameCompare(c.name, cardName))

  return { cards: matchingCards }
}
