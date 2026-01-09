import { printActionTriggeredMsg, getTools } from 'src/actions/helpers'
import { nameCompare } from 'src/string-utils'
import * as bp from '.botpress'

export const getListsInBoard: bp.Integration['actions']['getListsInBoard'] = async (props) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  const { boardId } = props.input
  const matchingLists = await trelloClient.getListsInBoard({ boardId })

  return { lists: matchingLists }
}

export const getListsByDisplayName: bp.Integration['actions']['getListsByDisplayName'] = async (props) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  const { boardId, listName } = props.input
  const lists = await trelloClient.getListsInBoard({ boardId })
  const matchingLists = lists.filter((l) => nameCompare(l.name, listName))

  return { lists: matchingLists }
}

export const getListById: bp.Integration['actions']['getListById'] = async (props) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  const { listId } = props.input
  const list = await trelloClient.getListById({ listId })

  return { list }
}
