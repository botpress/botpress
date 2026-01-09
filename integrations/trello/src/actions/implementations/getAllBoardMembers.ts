import { getTools, printActionTriggeredMsg } from '../helpers'
import * as bp from '.botpress'

export const getAllBoardMembers: bp.Integration['actions']['getAllBoardMembers'] = async (props) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  const { boardId } = props.input
  const members = await trelloClient.getBoardMembers({ boardId })
  return { members }
}
