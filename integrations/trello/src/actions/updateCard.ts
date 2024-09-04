import { ICardUpdateService } from 'src/interfaces/services/ICardUpdateService'
import { getContainer, DIToken } from 'src/iocContainer'
import { updateCardInputSchema } from 'src/schemas/actions'
import { extractFromCsv, wrapWithTryCatch } from 'src/utils'
import * as bp from '../../.botpress'

const updateCard: bp.IntegrationProps['actions']['updateCard'] = async ({ ctx, input }) => {
  const container = getContainer(ctx)
  const cardUpdateService = container.resolve<ICardUpdateService>(DIToken.CardUpdateService)

  const {
    bodyText,
    cardId,
    closedState,
    completeState,
    dueDate,
    labelsToAdd,
    labelsToRemove,
    membersToAdd,
    membersToRemove,
    name,
  } = updateCardInputSchema.parse(input)

  await cardUpdateService.updateCard(cardId, {
    name,
    bodyText,
    closedState,
    completeState,
    dueDate,
    membersToAdd: membersToAdd ? extractFromCsv(membersToAdd) : undefined,
    membersToRemove: membersToRemove ? extractFromCsv(membersToRemove) : undefined,
    labelsToAdd: labelsToAdd ? extractFromCsv(labelsToAdd) : undefined,
    labelsToRemove: labelsToRemove ? extractFromCsv(labelsToRemove) : undefined,
  })

  return { message: 'Card updated successfully.' }
}

export default wrapWithTryCatch(updateCard, 'Failed to update the card')
