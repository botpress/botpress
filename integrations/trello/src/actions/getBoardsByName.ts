import { IBoardQueryService } from 'src/interfaces/services/IBoardQueryService'
import { getContainer, DIToken } from 'src/iocContainer'
import { getBoardsByNameInputSchema } from 'src/schemas/actions'
import { wrapWithTryCatch } from 'src/utils'
import * as bp from '../../.botpress'

const getBoardsByName: bp.IntegrationProps['actions']['getBoardsByName'] = async ({ ctx, input }) => {
  const container = getContainer(ctx)
  const boardQueryService = container.resolve<IBoardQueryService>(DIToken.BoardQueryService)
  const { boardName } = getBoardsByNameInputSchema.parse(input)

  const matchingBoards = await boardQueryService.getBoardsByName(boardName)
  return { boards: matchingBoards }
}

export default wrapWithTryCatch(getBoardsByName, 'Failed to retrieve the board ID')
