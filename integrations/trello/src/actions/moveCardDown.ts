import { moveCardDownInputSchema } from 'src/schemas/actions'
import { wrapActionAndInjectServices } from 'src/utils'

export const moveCardDown = wrapActionAndInjectServices<'moveCardDown'>({
  async action({ input }, { cardUpdateService }) {
    const { cardId, moveDownByNSpaces } = moveCardDownInputSchema.parse(input)

    await cardUpdateService.moveCardVertically(cardId, -(moveDownByNSpaces ?? 1))
    return { message: 'Card successfully moved down' }
  },
  errorMessage: 'Failed to move the card down',
})
