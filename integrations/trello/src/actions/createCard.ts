import { ICardCreationService } from 'src/interfaces/services/ICardCreationService'
import { getContainer, DIToken } from 'src/iocContainer'
import { createCardInputSchema } from 'src/schemas/actions'
import { wrapWithTryCatch } from 'src/utils'
import * as bp from '../../.botpress'

const createCard: bp.IntegrationProps['actions']['createCard'] = async ({ ctx, input }) => {
  const container = getContainer(ctx)
  const cardCreationService = container.resolve<ICardCreationService>(DIToken.CardCreationService)

  const { listId, cardName, cardBody } = createCardInputSchema.parse(input)

  const newCard = await cardCreationService.createCard(cardName, cardBody ?? '', listId)

  return { message: `Card created successfully. Card ID: ${newCard.id}`, newCardId: newCard.id }
}

const wrapped = wrapWithTryCatch(createCard, 'Failed to create the new card')
export { wrapped as createCard }
