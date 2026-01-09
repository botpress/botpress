import { printActionTriggeredMsg, getTools } from '../helpers'
import * as bp from '.botpress'

export const getMemberByIdOrUsername: bp.Integration['actions']['getMemberByIdOrUsername'] = async (props) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  const { memberIdOrUsername } = props.input
  const member = await trelloClient.getMemberByIdOrUsername({ memberId: memberIdOrUsername })

  return { member }
}
