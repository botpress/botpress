import { ICardUpdateService } from 'src/interfaces/services/ICardUpdateService'
import { getContainer, DIToken } from 'src/iocContainer'
import { moveCardUpInputSchema } from 'src/schemas/actions'
import { wrapWithTryCatch } from 'src/utils'
import * as bp from '../../.botpress'

const moveCardUp: bp.IntegrationProps['actions']['moveCardUp'] = async ({ ctx, input }) => {
  const container = getContainer(ctx)
  const cardUpdateService = container.resolve<ICardUpdateService>(DIToken.CardUpdateService)
  const { cardId, moveUpByNSpaces } = moveCardUpInputSchema.parse(input)

  await cardUpdateService.moveCardVertically(cardId, moveUpByNSpaces ?? 1)

  return { message: 'Card successfully moved up' }
}

const wrapped = wrapWithTryCatch(moveCardUp, 'Failed to move the card up')
export { wrapped as moveCardUp }
