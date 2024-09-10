import { moveCardUpInputSchema } from 'src/schemas/actions'
import { wrapActionAndInjectServices } from 'src/utils'

export const moveCardUp = wrapActionAndInjectServices<'moveCardUp'>({
  async action({ input }, { cardUpdateService }) {
    const { cardId, moveUpByNSpaces } = moveCardUpInputSchema.parse(input)

    await cardUpdateService.moveCardVertically(cardId, moveUpByNSpaces ?? 1)
    return { message: 'Card successfully moved up' }
  },
  errorMessage: 'Failed to move the card up',
})
