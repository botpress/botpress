import * as sdk from '@botpress/sdk'
import { wrapAction } from '../../action-wrapper'

export const boardMemberList = wrapAction(
  { actionName: 'boardMemberList' },
  async ({ trelloClient }, { nextToken: boardId }) => {
    if (!boardId) {
      throw new sdk.RuntimeError('Board ID is required: make sure the nextToken parameter contains the board ID')
    }

    const items = await trelloClient.getBoardMembers({ boardId })
    return { items, meta: {} }
  }
)
