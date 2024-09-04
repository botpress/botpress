import { IBoardQueryService } from 'src/interfaces/services/IBoardQueryService'
import { getContainer, DIToken } from 'src/iocContainer'
import { wrapWithTryCatch } from 'src/utils'
import * as bp from '../../.botpress'

const getAllBoards: bp.IntegrationProps['actions']['getAllBoards'] = async ({ ctx }) => {
  const container = getContainer(ctx)
  const boardQueryService = container.resolve<IBoardQueryService>(DIToken.BoardQueryService)

  const boards = await boardQueryService.getUserBoards()
  return { boards }
}

export default wrapWithTryCatch(getAllBoards, 'Failed to retrieve the list of all boards')
