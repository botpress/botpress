import { ICardQueryService } from 'src/interfaces/services/ICardQueryService'
import { getContainer, DIToken } from 'src/iocContainer'
import { getCardsByDisplayNameInputSchema } from 'src/schemas/actions'
import { wrapWithTryCatch } from 'src/utils'
import * as bp from '../../.botpress'

const getCardsByDisplayName: bp.IntegrationProps['actions']['getCardsByDisplayName'] = async ({ ctx, input }) => {
  const container = getContainer(ctx)
  const cardQueryService = container.resolve<ICardQueryService>(DIToken.CardQueryService)
  const { listId, cardName } = getCardsByDisplayNameInputSchema.parse(input)

  const matchingCards = await cardQueryService.getCardsByDisplayName(listId, cardName)
  return { cards: matchingCards }
}

const wrapped = wrapWithTryCatch(getCardsByDisplayName, 'Failed to retrieve the cards')
export { wrapped as getCardsByDisplayName }
