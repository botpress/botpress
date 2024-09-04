import { ICardQueryService } from 'src/interfaces/services/ICardQueryService'
import { getContainer, DIToken } from 'src/iocContainer'
import { getCardsByNameInputSchema } from 'src/schemas/actions'
import { wrapWithTryCatch } from 'src/utils'
import * as bp from '../../.botpress'

const getCardsByName: bp.IntegrationProps['actions']['getCardsByName'] = async ({ ctx, input }) => {
  const container = getContainer(ctx)
  const cardQueryService = container.resolve<ICardQueryService>(DIToken.CardQueryService)
  const { listId, cardName } = getCardsByNameInputSchema.parse(input)

  const matchingCards: Awaited<ReturnType<bp.IntegrationProps['actions']['getCardsByName']>>['cards'] =
    await cardQueryService.getCardsByName(listId, cardName)
  return { cards: matchingCards }
}

export default wrapWithTryCatch(getCardsByName, 'Failed to retrieve the card ID')
