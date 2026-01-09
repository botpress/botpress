import { printActionTriggeredMsg, getTools } from '../helpers'
import * as bp from '.botpress'

export const getCardById: bp.Integration['actions']['getCardById'] = async (props) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  const card = await trelloClient.getCardById({ cardId: props.input.cardId })
  return { card }
}
