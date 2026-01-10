import { printActionTriggeredMsg, getTools } from '../helpers'
import * as bp from '.botpress'

export const getBoardById: bp.Integration['actions']['getBoardById'] = async (props) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  const { boardId } = props.input
  const board = await trelloClient.getBoardById({ boardId })

  return { board }
}
