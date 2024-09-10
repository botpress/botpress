import { moveCardToListInputSchema } from 'src/schemas/actions'
import { wrapActionAndInjectServices } from 'src/utils'

export const moveCardToList = wrapActionAndInjectServices<'moveCardToList'>({
  async action({ input }, { cardUpdateService }) {
    const { cardId, newListId } = moveCardToListInputSchema.parse(input)

    await cardUpdateService.moveCardToOtherList(cardId, newListId)
    return { message: 'Card successfully moved to the new list' }
  },
  errorMessage: 'Failed to move the card to the new list',
})
