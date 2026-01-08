import { nameCompare } from 'src/string-utils'
import { printActionTriggeredMsg, getTools } from '../helpers'
import * as bp from '.botpress'

export const getBoardMembersByDisplayName: bp.Integration['actions']['getBoardMembersByDisplayName'] = async (
  props
) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  const { boardId, displayName } = props.input
  const members = await trelloClient.getBoardMembers({ boardId })
  const matchingMembers = members.filter((m) => nameCompare(m.fullName, displayName))

  return { members: matchingMembers }
}
