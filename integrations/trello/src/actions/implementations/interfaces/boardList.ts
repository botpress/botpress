import { getTools, printActionTriggeredMsg } from '../../helpers'
import * as bp from '.botpress'

export const boardList: bp.Integration['actions']['boardList'] = async (props) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  return {
    items: await trelloClient.getAllBoards(),
    meta: {},
  }
}
