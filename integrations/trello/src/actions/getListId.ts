import { IListQueryService } from 'src/interfaces/services/IListQueryService'
import { getContainer, DIToken } from 'src/iocContainer'
import { getListIdInputSchema } from 'src/schemas/actions'
import * as bp from '../../.botpress'

export const getListId: bp.IntegrationProps['actions']['getListId'] = async ({ ctx, input }) => {
  const container = getContainer(ctx)
  const listQueryService = container.resolve<IListQueryService>(DIToken.ListQueryService)
  const { boardId, listName } = getListIdInputSchema.parse(input)

  const matchingLists = await listQueryService.getListsByName(boardId, listName)
  return { lists: matchingLists }
}
