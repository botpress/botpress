import { IBoardQueryService } from 'src/interfaces/services/IBoardQueryService'
import { getContainer, DIToken } from 'src/iocContainer'
import { getListsInBoardInputSchema } from 'src/schemas/actions'
import { wrapWithTryCatch } from 'src/utils'
import * as bp from '../../.botpress'

const getListsInBoard: bp.IntegrationProps['actions']['getListsInBoard'] = async ({ ctx, input }) => {
  const container = getContainer(ctx)
  const boardQueryService = container.resolve<IBoardQueryService>(DIToken.BoardQueryService)
  const { boardId } = getListsInBoardInputSchema.parse(input)

  const matchingLists = await boardQueryService.getListsInBoard(boardId)
  return { lists: matchingLists }
}

export default wrapWithTryCatch(getListsInBoard, 'Failed to retrieve the lists')
