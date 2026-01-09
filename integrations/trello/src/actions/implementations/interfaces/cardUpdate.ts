import { getTools, printActionTriggeredMsg } from '../../helpers'
import * as bp from '.botpress'

export const cardUpdate: bp.Integration['actions']['cardUpdate'] = async (props) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  const { item } = props.input
  const newCard = await trelloClient.updateCard({
    partialCard: item,
  })

  return { item: newCard, meta: {} }
}
