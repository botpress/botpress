import { nameCompare } from 'src/string-utils'
import { printActionTriggeredMsg, getTools } from '../helpers'
import * as bp from '.botpress'

export const getListsByDisplayName: bp.Integration['actions']['getListsByDisplayName'] = async (props) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  const { boardId, listName } = props.input
  const lists = await trelloClient.getListsInBoard({ boardId })
  const matchingLists = lists.filter((l) => nameCompare(l.name, listName))

  return { lists: matchingLists }
}
