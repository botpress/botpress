import { updateCardInputSchema } from 'src/schemas/actions'
import { extractFromCsv, wrapActionAndInjectServices } from 'src/utils'

export const updateCard = wrapActionAndInjectServices<'updateCard'>({
  async action({ input }, { cardUpdateService }) {
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
  },
  errorMessage: 'Failed to update the card',
})
