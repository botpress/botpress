import { nameCompare } from 'src/string-utils'
import { printActionTriggeredMsg, getTools } from '../helpers'
import * as bp from '.botpress'

export const getBoardsByDisplayName: bp.Integration['actions']['getBoardsByDisplayName'] = async (props) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  const { boardName } = props.input
  const boards = await trelloClient.getAllBoards()
  const matchingBoards = boards.filter((b) => nameCompare(b.name, boardName))

  return { boards: matchingBoards }
}
