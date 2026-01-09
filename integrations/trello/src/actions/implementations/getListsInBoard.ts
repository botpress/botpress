import { printActionTriggeredMsg, getTools } from '../helpers'
import * as bp from '.botpress'

export const getListsInBoard: bp.Integration['actions']['getListsInBoard'] = async (props) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  const { boardId } = props.input
  const matchingLists = await trelloClient.getListsInBoard({ boardId })

  return { lists: matchingLists }
}
