import { ICardUpdateService } from 'src/interfaces/services/ICardUpdateService'
import { getContainer, DIToken } from 'src/iocContainer'
import { moveCardDownInputSchema } from 'src/schemas/actions'
import { wrapWithTryCatch } from 'src/utils'
import * as bp from '../../.botpress'

const moveCardDown: bp.IntegrationProps['actions']['moveCardDown'] = async ({ ctx, input }) => {
  const container = getContainer(ctx)
  const cardUpdateService = container.resolve<ICardUpdateService>(DIToken.CardUpdateService)
  const { cardId, moveDownByNSpaces } = moveCardDownInputSchema.parse(input)

  await cardUpdateService.moveCardVertically(cardId, -(moveDownByNSpaces ?? 1))

  return { message: 'Card successfully moved down' }
}

const wrapped = wrapWithTryCatch(moveCardDown, 'Failed to move the card down')
export { wrapped as moveCardDown }
