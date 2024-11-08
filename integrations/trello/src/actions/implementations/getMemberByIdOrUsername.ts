import { wrapAction } from '../action-wrapper'

export const getMemberByIdOrUsername = wrapAction(
  { actionName: 'getMemberByIdOrUsername' },
  async ({ trelloClient }, { memberIdOrUsername }) => {
    const member = await trelloClient.getMemberByIdOrUsername({ memberId: memberIdOrUsername })

    return { member }
  }
)
