import { IListQueryService } from 'src/interfaces/services/IListQueryService'
import { getContainer, DIToken } from 'src/iocContainer'
import { getListByIdInputSchema } from 'src/schemas/actions/getListByIdInputSchema'
import { wrapWithTryCatch } from 'src/utils'
import * as bp from '../../.botpress'

const getListById: bp.IntegrationProps['actions']['getListById'] = async ({ ctx, input }) => {
  const container = getContainer(ctx)
  const listQueryService = container.resolve<IListQueryService>(DIToken.ListQueryService)
  const { listId } = getListByIdInputSchema.parse(input)

  const list = await listQueryService.getListById(listId)
  return { list }
}

const wrapped = wrapWithTryCatch(getListById, 'Failed to retrieve the list')
export { wrapped as getListById }
