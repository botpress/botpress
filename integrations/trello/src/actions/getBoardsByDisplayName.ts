import { IBoardQueryService } from 'src/interfaces/services/IBoardQueryService'
import { getContainer, DIToken } from 'src/iocContainer'
import { getBoardsByDisplayNameInputSchema } from 'src/schemas/actions'
import { wrapWithTryCatch } from 'src/utils'
import * as bp from '../../.botpress'

const getBoardsByDisplayName: bp.IntegrationProps['actions']['getBoardsByDisplayName'] = async ({ ctx, input }) => {
  const container = getContainer(ctx)
  const boardQueryService = container.resolve<IBoardQueryService>(DIToken.BoardQueryService)
  const { boardName } = getBoardsByDisplayNameInputSchema.parse(input)

  const matchingBoards = await boardQueryService.getBoardsByDisplayName(boardName)
  return { boards: matchingBoards }
}

const wrapped = wrapWithTryCatch(getBoardsByDisplayName, 'Failed to retrieve the boards')
export { wrapped as getBoardsByDisplayName }
