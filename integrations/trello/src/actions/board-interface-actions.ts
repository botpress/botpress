import * as sdk from '@botpress/sdk'
import { printActionTriggeredMsg, getTools } from 'src/actions/helpers'
import * as bp from '.botpress'

export const boardList: bp.Integration['actions']['boardList'] = async (props) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  return {
    items: await trelloClient.getAllBoards(),
    meta: {},
  }
}

export const boardRead: bp.Integration['actions']['boardRead'] = async (props) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  const { id: boardId } = props.input
  if (!boardId) {
    throw new sdk.RuntimeError('Board ID is required: make sure the id parameter contains the board ID')
  }

  const item = await trelloClient.getBoardById({ boardId })
  return { item, meta: {} }
}
