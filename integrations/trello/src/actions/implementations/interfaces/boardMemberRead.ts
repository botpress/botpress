import * as sdk from '@botpress/sdk'
import { wrapAction } from '../../action-wrapper'

export const boardMemberRead = wrapAction(
  { actionName: 'boardMemberRead' },
  async ({ trelloClient }, { id: boardMemberId }) => {
    if (!boardMemberId) {
      throw new sdk.RuntimeError('Member ID is required: make sure the id parameter contains the member ID')
    }

    const item = await trelloClient.getMemberByIdOrUsername({ memberId: boardMemberId })
    return { item, meta: {} }
  }
)
