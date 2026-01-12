import { printActionTriggeredMsg, getTools } from '../helpers'
import { moveCardVertically } from './shared/move-card-vertically'
import * as bp from '.botpress'

export const moveCardUp: bp.Integration['actions']['moveCardUp'] = async (props) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  const { cardId, moveUpByNSpaces } = props.input
  const numOfPositions = moveUpByNSpaces ?? 1
  await moveCardVertically({ trelloClient, cardId, numOfPositions })

  return { message: 'Card successfully moved up' }
}
