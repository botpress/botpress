import { IBoardQueryService } from 'src/interfaces/services/IBoardQueryService'
import { getContainer, DIToken } from 'src/iocContainer'
import { getAllBoardMembersInputSchema } from 'src/schemas/actions'
import { wrapWithTryCatch } from 'src/utils'
import * as bp from '../../.botpress'

const getAllBoardMembers: bp.IntegrationProps['actions']['getAllBoardMembers'] = async ({ ctx, input }) => {
  const container = getContainer(ctx)
  const boardQueryService = container.resolve<IBoardQueryService>(DIToken.BoardQueryService)
  const { boardId } = getAllBoardMembersInputSchema.parse(input)

  const members = await boardQueryService.getBoardMembers(boardId)
  return { members }
}

export default wrapWithTryCatch(getAllBoardMembers, 'Failed to retrieve the members of the board')
