import { cardUpdateInputSchema } from 'src/schemas/actions/interfaces/cardUpdateInputSchema'
import { wrapActionAndInjectServices } from '../../utils'

export const cardUpdate = wrapActionAndInjectServices<'cardUpdate'>({
  async action({ input }, { cardRepository }) {
    const card = cardUpdateInputSchema.parse(input).item

    await cardRepository.updateCard(card)

    return { item: card, id: card.id }
  },
  errorMessage: 'Failed to update the card',
})
