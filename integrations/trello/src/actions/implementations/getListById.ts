import { printActionTriggeredMsg, getTools } from '../helpers'
import * as bp from '.botpress'

export const getListById: bp.Integration['actions']['getListById'] = async (props) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  const { listId } = props.input
  const list = await trelloClient.getListById({ listId })

  return { list }
}
