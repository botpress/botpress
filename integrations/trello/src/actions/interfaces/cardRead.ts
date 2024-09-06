import { cardReadInputSchema } from 'src/schemas/actions/interfaces/cardReadInputSchema'
import { wrapActionAndInjectServices } from 'src/utils'

export const cardRead = wrapActionAndInjectServices<'cardRead'>({
  async action({ input }, { cardRepository }) {
    const { id: cardId } = cardReadInputSchema.parse(input)
    const item = await cardRepository.getCardById(cardId)

    return { item, meta: {} }
  },
  errorMessage: 'Failed to retrieve the card',
})
