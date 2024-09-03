import { ICardQueryService } from 'src/interfaces/services/ICardQueryService'
import { getContainer, DIToken } from 'src/iocContainer'
import { getCardIdInputSchema } from 'src/schemas/actions'
import * as bp from '../../.botpress'

export const getCardId: bp.IntegrationProps['actions']['getCardId'] = async ({ ctx, input }) => {
  const container = getContainer(ctx)
  const cardQueryService = container.resolve<ICardQueryService>(DIToken.CardQueryService)
  const { listId, cardName } = getCardIdInputSchema.parse(input)

  const matchingCards = await cardQueryService.getCardsByName(listId, cardName)
  return { cards: matchingCards }
}
