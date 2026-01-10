import * as sdk from '@botpress/sdk'
import { getTools, printActionTriggeredMsg } from '../../helpers'
import * as bp from '.botpress'

export const cardList: bp.Integration['actions']['cardList'] = async (props) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  const { nextToken: listId } = props.input
  if (!listId) {
    throw new sdk.RuntimeError('List ID is required: make sure the nextToken parameter contains the list ID')
  }

  const items = await trelloClient.getCardsInList({ listId })
  return { items, meta: {} }
}
