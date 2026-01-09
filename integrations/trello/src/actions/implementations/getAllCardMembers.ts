import { printActionTriggeredMsg, getTools } from '../helpers'
import * as bp from '.botpress'

export const getAllCardMembers: bp.Integration['actions']['getAllCardMembers'] = async (props) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  const { cardId } = props.input
  return {
    members: await trelloClient.getCardMembers({ cardId }),
  }
}
