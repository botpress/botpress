import * as sdk from '@botpress/sdk'
import { getTools, printActionTriggeredMsg } from '../../helpers'
import * as bp from '.botpress'

export const boardMemberList: bp.Integration['actions']['boardMemberList'] = async (props) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  const { nextToken: boardId } = props.input
  if (!boardId) {
    throw new sdk.RuntimeError('Board ID is required: make sure the nextToken parameter contains the board ID')
  }

  const items = await trelloClient.getBoardMembers({ boardId })
  return { items, meta: {} }
}
