import { ICardUpdateService } from 'src/interfaces/services/ICardUpdateService'
import { getContainer, DIToken } from 'src/iocContainer'
import { moveCardToListInputSchema } from 'src/schemas/actions'
import { wrapWithTryCatch } from 'src/utils'
import * as bp from '../../.botpress'

const moveCardToList: bp.IntegrationProps['actions']['moveCardToList'] = async ({ ctx, input }) => {
  const container = getContainer(ctx)
  const cardUpdateService = container.resolve<ICardUpdateService>(DIToken.CardUpdateService)
  const { cardId, newListId } = moveCardToListInputSchema.parse(input)

  await cardUpdateService.moveCardToOtherList(cardId, newListId)

  return { message: 'Card successfully moved to the new list' }
}

const wrapped = wrapWithTryCatch(moveCardToList, 'Failed to move the card to the new list')
export { wrapped as moveCardToList }
