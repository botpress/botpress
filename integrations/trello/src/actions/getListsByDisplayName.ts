import { IListQueryService } from 'src/interfaces/services/IListQueryService'
import { getContainer, DIToken } from 'src/iocContainer'
import { getListsByDisplayNameInputSchema } from 'src/schemas/actions'
import { wrapWithTryCatch } from 'src/utils'
import * as bp from '../../.botpress'

const getListsByDisplayName: bp.IntegrationProps['actions']['getListsByDisplayName'] = async ({ ctx, input }) => {
  const container = getContainer(ctx)
  const listQueryService = container.resolve<IListQueryService>(DIToken.ListQueryService)
  const { boardId, listName } = getListsByDisplayNameInputSchema.parse(input)

  const matchingLists = await listQueryService.getListsByDisplayName(boardId, listName)
  return { lists: matchingLists }
}

export default wrapWithTryCatch(getListsByDisplayName, 'Failed to retrieve the lists')
