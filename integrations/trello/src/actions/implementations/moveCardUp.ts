import { wrapAction } from '../action-wrapper'
import { moveCardVertically } from './shared/move-card-vertically'

export const moveCardUp = wrapAction(
  { actionName: 'moveCardUp' },
  async ({ trelloClient }, { cardId, moveUpByNSpaces }) => {
    const nbPositions = moveUpByNSpaces ?? 1
    await moveCardVertically({ trelloClient, cardId, nbPositions })

    return { message: 'Card successfully moved up' }
  }
)
