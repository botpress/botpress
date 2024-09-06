import { IBoardQueryService } from 'src/interfaces/services/IBoardQueryService'
import { getContainer, DIToken } from 'src/iocContainer'
import { getBoardByIdInputSchema } from 'src/schemas/actions/getBoardByIdInputSchema'
import { wrapWithTryCatch } from 'src/utils'
import * as bp from '../../.botpress'

const getBoardById: bp.IntegrationProps['actions']['getBoardById'] = async ({ ctx, input }) => {
  const container = getContainer(ctx)
  const boardQueryService = container.resolve<IBoardQueryService>(DIToken.BoardQueryService)
  const { boardId } = getBoardByIdInputSchema.parse(input)

  const board = await boardQueryService.getBoardById(boardId)
  return { board }
}

const wrapped = wrapWithTryCatch(getBoardById, 'Failed to retrieve the board')
export { wrapped as getBoardById }
