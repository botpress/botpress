import { getCardByIdInputSchema } from 'src/schemas/actions/getCardByIdInputSchema'
import { wrapActionAndInjectServices } from 'src/utils'

export const getCardById = wrapActionAndInjectServices<'getCardById'>({
  async action({ input }, { cardRepository }) {
    const { cardId } = getCardByIdInputSchema.parse(input)

    const card = await cardRepository.getCardById(cardId)
    return { card }
  },
  errorMessage: 'Failed to retrieve the card',
})
