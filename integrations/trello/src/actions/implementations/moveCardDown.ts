import { printActionTriggeredMsg, getTools } from '../helpers'
import { moveCardVertically } from './shared/move-card-vertically'
import * as bp from '.botpress'

export const moveCardDown: bp.Integration['actions']['moveCardDown'] = async (props) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  const { cardId, moveDownByNSpaces } = props.input
  const numOfPositions = -(moveDownByNSpaces ?? 1)
  await moveCardVertically({ trelloClient, cardId, numOfPositions })

  return { message: 'Card successfully moved down' }
}
