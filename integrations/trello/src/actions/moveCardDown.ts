import { wrapActionAndInjectServices } from 'src/utils'

export const moveCardDown = wrapActionAndInjectServices<'moveCardDown'>({
  async action({ input }, { cardUpdateService }) {
    const { cardId, moveDownByNSpaces } = input

    await cardUpdateService.moveCardVertically(cardId, -(moveDownByNSpaces ?? 1))
    return { message: 'Card successfully moved down' }
  },
  errorMessage: 'Failed to move the card down',
})
