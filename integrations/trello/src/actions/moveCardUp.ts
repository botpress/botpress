import { ICardUpdateService } from 'src/interfaces/services/ICardUpdateService'
import { getContainer, DIToken } from 'src/iocContainer'
import { moveCardUpInputSchema } from 'src/schemas/actions'
import * as bp from '../../.botpress'

export const moveCardUp: bp.IntegrationProps['actions']['moveCardUp'] = async ({ ctx, input }) => {
  const container = getContainer(ctx)
  const cardUpdateService = container.resolve<ICardUpdateService>(DIToken.CardUpdateService)
  const { cardId, moveUpByNSpaces } = moveCardUpInputSchema.parse(input)

  await cardUpdateService.moveCardVertically(cardId, moveUpByNSpaces ?? 1)

  return { message: 'Card successfully moved up' }
}
