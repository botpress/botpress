import { createCardInputSchema } from 'src/schemas/actions'
import { wrapActionAndInjectServices } from 'src/utils'

export const createCard = wrapActionAndInjectServices<'createCard'>({
  async action({ input }, { cardRepository }) {
    const { listId, cardName, cardBody } = createCardInputSchema.parse(input)

    const newCard = await cardRepository.createCard({
      name: cardName,
      description: cardBody ?? '',
      listId,
    })

    return { message: `Card created successfully. Card ID: ${newCard.id}`, newCardId: newCard.id }
  },
  errorMessage: 'Failed to create the new card',
})
