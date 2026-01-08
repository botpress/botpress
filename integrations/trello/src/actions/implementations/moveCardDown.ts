import { wrapAction } from '../action-wrapper'
import { moveCardVertically } from './shared/move-card-vertically'

export const moveCardDown = wrapAction(
  { actionName: 'moveCardDown' },
  async ({ trelloClient }, { cardId, moveDownByNSpaces }) => {
    const numOfPositions = -(moveDownByNSpaces ?? 1)
    await moveCardVertically({ trelloClient, cardId, numOfPositions })

    return { message: 'Card successfully moved down' }
  }
)
