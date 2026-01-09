import * as sdk from '@botpress/sdk'
import { printActionTriggeredMsg, getTools } from './helpers'
import * as bp from '.botpress'

export const listList: bp.Integration['actions']['listList'] = async (props) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  const { nextToken: boardId } = props.input
  if (!boardId) {
    throw new sdk.RuntimeError('Board ID is required: make sure the nextToken parameter contains the board ID')
  }

  const items = await trelloClient.getListsInBoard({ boardId })
  return { items, meta: {} }
}

export const listRead: bp.Integration['actions']['listRead'] = async (props) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  const { id: listId } = props.input
  if (!listId) {
    throw new sdk.RuntimeError('List ID is required: make sure the id parameter contains the list ID')
  }

  const item = await trelloClient.getListById({ listId })
  return { item, meta: {} }
}
