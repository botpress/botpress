import { IListQueryService } from 'src/interfaces/services/IListQueryService'
import { getContainer, DIToken } from 'src/iocContainer'
import { getCardsInListInputSchema } from 'src/schemas/actions'
import { wrapWithTryCatch } from 'src/utils'
import * as bp from '../../.botpress'

const getCardsInList: bp.IntegrationProps['actions']['getCardsInList'] = async ({ ctx, input }) => {
  const container = getContainer(ctx)
  const listQueryService = container.resolve<IListQueryService>(DIToken.ListQueryService)
  const { listId } = getCardsInListInputSchema.parse(input)

  const matchingCards = await listQueryService.getCardsInList(listId)
  return { cards: matchingCards }
}

const wrapped = wrapWithTryCatch(getCardsInList, 'Failed to retrieve the cards')
export { wrapped as getCardsInList }
