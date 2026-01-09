import * as sdk from '@botpress/sdk'
import { getTools, printActionTriggeredMsg } from '../../helpers'
import * as bp from '.botpress'

export const cardMemberList: bp.Integration['actions']['cardMemberList'] = async (props) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  const { nextToken: cardId } = props.input
  if (!cardId) {
    throw new sdk.RuntimeError('Card ID is required: make sure the nextToken parameter contains the card ID')
  }

  const items = await trelloClient.getCardMembers({ cardId })
  return { items, meta: {} }
}
