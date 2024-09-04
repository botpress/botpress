import { IListQueryService } from 'src/interfaces/services/IListQueryService'
import { getContainer, DIToken } from 'src/iocContainer'
import { getListsByNameInputSchema } from 'src/schemas/actions'
import { wrapWithTryCatch } from 'src/utils'
import * as bp from '../../.botpress'

const getListsByName: bp.IntegrationProps['actions']['getListsByName'] = async ({ ctx, input }) => {
  const container = getContainer(ctx)
  const listQueryService = container.resolve<IListQueryService>(DIToken.ListQueryService)
  const { boardId, listName } = getListsByNameInputSchema.parse(input)

  const matchingLists = await listQueryService.getListsByName(boardId, listName)
  return { lists: matchingLists }
}

export default wrapWithTryCatch(getListsByName, 'Failed to retrieve the list ID')
