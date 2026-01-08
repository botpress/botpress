import { getTools, printActionTriggeredMsg } from '../../helpers'
import * as bp from '.botpress'

export const cardCreate: bp.Integration['actions']['cardCreate'] = async (props) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  const { item } = props.input
  const newCard = await trelloClient.createCard({
    card: item,
  })

  return { item: newCard, meta: {} }
}
