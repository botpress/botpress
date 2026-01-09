import * as sdk from '@botpress/sdk'
import { getTools, printActionTriggeredMsg } from '../../helpers'
import * as bp from '.botpress'

export const cardDelete: bp.Integration['actions']['cardDelete'] = async (props) => {
  printActionTriggeredMsg(props)
  const { trelloClient } = getTools(props)

  const { id: cardId } = props.input
  if (!cardId) {
    throw new sdk.RuntimeError('Card ID is required: make sure the id parameter contains the card ID')
  }

  // This effectively archives the card (soft deletion):
  const item = await trelloClient.updateCard({ partialCard: { id: cardId, isClosed: true } })

  return { item, meta: {} }
}
