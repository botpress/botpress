import * as sdk from '@botpress/sdk'
import { getTools, printActionTriggeredMsg } from '../../helpers'
import * as bp from '.botpress'

export const cardMemberRead: bp.Integration['actions']['cardMemberRead'] = async (props) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  const { id: cardMemberId } = props.input
  if (!cardMemberId) {
    throw new sdk.RuntimeError('Member ID is required: make sure the id parameter contains the member ID')
  }

  const item = await trelloClient.getMemberByIdOrUsername({ memberId: cardMemberId })
  return { item, meta: {} }
}
