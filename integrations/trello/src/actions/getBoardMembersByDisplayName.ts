import { getBoardMembersByDisplayNameInputSchema } from 'src/schemas/actions'
import { wrapActionAndInjectServices } from 'src/utils'

export const getBoardMembersByDisplayName = wrapActionAndInjectServices<'getBoardMembersByDisplayName'>({
  async action({ input }, { boardQueryService }) {
    const { boardId, displayName } = getBoardMembersByDisplayNameInputSchema.parse(input)

    const matchingMembers = await boardQueryService.getBoardMembersByDisplayName(boardId, displayName)
    return { members: matchingMembers }
  },
  errorMessage: 'Failed to retrieve the board members',
})
