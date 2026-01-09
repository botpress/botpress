import * as sdk from '@botpress/sdk'
import { getTools, printActionTriggeredMsg } from '../../helpers'
import * as bp from '.botpress'

export const listRead: bp.Integration['actions']['listRead'] = async (props) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  const { id: listId } = props.input
  if (!listId) {
    throw new sdk.RuntimeError('List ID is required: make sure the id parameter contains the list ID')
  }

  const item = await trelloClient.getListById({ listId })
  return { item, meta: {} }
}
