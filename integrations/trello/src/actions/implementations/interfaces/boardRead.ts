import * as sdk from '@botpress/sdk'
import { getTools, printActionTriggeredMsg } from '../../helpers'
import * as bp from '.botpress'

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
