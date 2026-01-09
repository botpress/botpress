import { printActionTriggeredMsg, getTools } from 'src/actions/helpers'
import { nameCompare } from 'src/string-utils'
import * as bp from '.botpress'

export const getAllBoards: bp.Integration['actions']['getAllBoards'] = async (props) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  const {} = props.input
  const boards = await trelloClient.getAllBoards()
  return { boards }
}

export const getBoardById: bp.Integration['actions']['getBoardById'] = async (props) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  const { boardId } = props.input
  const board = await trelloClient.getBoardById({ boardId })

  return { board }
}

export const getBoardsByDisplayName: bp.Integration['actions']['getBoardsByDisplayName'] = async (props) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  const { boardName } = props.input
  const boards = await trelloClient.getAllBoards()
  const matchingBoards = boards.filter((b) => nameCompare(b.name, boardName))

  return { boards: matchingBoards }
}
