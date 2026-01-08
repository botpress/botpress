import { wrapAction } from '../action-wrapper'
import { moveCardVertically } from './shared/move-card-vertically'

export const moveCardUp = wrapAction(
  { actionName: 'moveCardUp' },
  async ({ trelloClient }, { cardId, moveUpByNSpaces }) => {
    const numOfPositions = moveUpByNSpaces ?? 1
    await moveCardVertically({ trelloClient, cardId, numOfPositions })

    return { message: 'Card successfully moved up' }
  }
)
