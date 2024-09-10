import { getCardByIdInputSchema } from 'src/schemas/actions/getCardByIdInputSchema'
import { wrapActionAndInjectServices } from 'src/utils'

export const getCardById = wrapActionAndInjectServices<'getCardById'>({
  async action({ input }, { cardQueryService }) {
    const { cardId } = getCardByIdInputSchema.parse(input)

    const card = await cardQueryService.getCardById(cardId)
    return { card }
  },
  errorMessage: 'Failed to retrieve the card',
})
