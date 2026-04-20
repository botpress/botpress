import { nameCompare } from '../string-utils'
import { printActionTriggeredMsg, getTools } from './helpers'
import * as bp from '.botpress'

export const getAllBoardMembers: bp.Integration['actions']['getAllBoardMembers'] = async (props) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  const { boardId } = props.input
  const members = await trelloClient.getBoardMembers({ boardId })
  return { members }
}

export const getAllCardMembers: bp.Integration['actions']['getAllCardMembers'] = async (props) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  const { cardId } = props.input
  return {
    members: await trelloClient.getCardMembers({ cardId }),
  }
}

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

export const getMemberByIdOrUsername: bp.Integration['actions']['getMemberByIdOrUsername'] = async (props) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  const { memberIdOrUsername } = props.input
  const member = await trelloClient.getMemberByIdOrUsername({ memberId: memberIdOrUsername })

  return { member }
}
