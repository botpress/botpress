import { printActionTriggeredMsg, getTools } from '../helpers'
import * as bp from '.botpress'

export const getAllBoards: bp.Integration['actions']['getAllBoards'] = async (props) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  const {} = props.input
  const boards = await trelloClient.getAllBoards()
  return { boards }
}
