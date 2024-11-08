import { wrapAction } from '../action-wrapper'
import { moveCardVertically } from './shared/move-card-vertically'

export const moveCardDown = wrapAction(
  { actionName: 'moveCardDown' },
  async ({ trelloClient }, { cardId, moveDownByNSpaces }) => {
    const nbPositions = -(moveDownByNSpaces ?? 1)
    await moveCardVertically({ trelloClient, cardId, nbPositions })

    return { message: 'Card successfully moved down' }
  }
)
