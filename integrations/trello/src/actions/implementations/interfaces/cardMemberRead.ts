import * as sdk from '@botpress/sdk'
import { wrapAction } from '../../action-wrapper'

export const cardMemberRead = wrapAction(
  { actionName: 'cardMemberRead' },
  async ({ trelloClient }, { id: cardMemberId }) => {
    if (!cardMemberId) {
      throw new sdk.RuntimeError('Member ID is required: make sure the id parameter contains the member ID')
    }

    const item = await trelloClient.getMemberByIdOrUsername({ memberId: cardMemberId })
    return { item, meta: {} }
  }
)
