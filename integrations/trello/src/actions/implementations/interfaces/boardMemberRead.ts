import * as sdk from '@botpress/sdk'
import { getTools, printActionTriggeredMsg } from '../../helpers'
import * as bp from '.botpress'

export const boardMemberRead: bp.Integration['actions']['boardMemberRead'] = async (props) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  const { id: boardMemberId } = props.input
  if (!boardMemberId) {
    throw new sdk.RuntimeError('Member ID is required: make sure the id parameter contains the member ID')
  }

  const item = await trelloClient.getMemberByIdOrUsername({ memberId: boardMemberId })
  return { item, meta: {} }
}
