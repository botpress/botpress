import { IBoardQueryService } from 'src/interfaces/services/IBoardQueryService'
import { getContainer, DIToken } from 'src/iocContainer'
import { getBoardMembersByDisplayNameInputSchema } from 'src/schemas/actions'
import { wrapWithTryCatch } from 'src/utils'
import * as bp from '../../.botpress'

const getBoardMembersByDisplayName: bp.IntegrationProps['actions']['getBoardMembersByDisplayName'] = async ({
  ctx,
  input,
}) => {
  const container = getContainer(ctx)
  const boardQueryService = container.resolve<IBoardQueryService>(DIToken.BoardQueryService)
  const { boardId, displayName } = getBoardMembersByDisplayNameInputSchema.parse(input)

  const matchingMembers = await boardQueryService.getBoardMembersByDisplayName(boardId, displayName)
  return { members: matchingMembers }
}

export default wrapWithTryCatch(getBoardMembersByDisplayName, 'Failed to retrieve the board members')
