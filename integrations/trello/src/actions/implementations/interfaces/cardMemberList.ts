import * as sdk from '@botpress/sdk'
import { wrapAction } from '../../action-wrapper'

export const cardMemberList = wrapAction(
  { actionName: 'cardMemberList' },
  async ({ trelloClient }, { nextToken: cardId }) => {
    if (!cardId) {
      throw new sdk.RuntimeError('Card ID is required: make sure the nextToken parameter contains the card ID')
    }

    const items = await trelloClient.getCardMembers({ cardId })
    return { items, meta: {} }
  }
)
