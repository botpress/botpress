import { nameCompare } from 'src/string-utils'
import { wrapAction } from '../action-wrapper'

export const getBoardMembersByDisplayName = wrapAction(
  { actionName: 'getBoardMembersByDisplayName' },
  async ({ trelloClient }, { boardId, displayName }) => {
    const members = await trelloClient.getBoardMembers({ boardId })
    const matchingMembers = members.filter((m) => nameCompare(m.fullName, displayName))

    return { members: matchingMembers }
  }
)
