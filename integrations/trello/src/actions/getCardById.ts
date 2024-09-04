import { ICardQueryService } from 'src/interfaces/services/ICardQueryService'
import { getContainer, DIToken } from 'src/iocContainer'
import { getCardByIdInputSchema } from 'src/schemas/actions/getCardByIdInputSchema'
import { wrapWithTryCatch } from 'src/utils'
import * as bp from '../../.botpress'

const getCardById: bp.IntegrationProps['actions']['getCardById'] = async ({ ctx, input }) => {
  const container = getContainer(ctx)
  const cardQueryService = container.resolve<ICardQueryService>(DIToken.CardQueryService)
  const { cardId } = getCardByIdInputSchema.parse(input)

  const card = await cardQueryService.getCardById(cardId)
  return { card }
}

export default wrapWithTryCatch(getCardById, 'Failed to retrieve the card')
