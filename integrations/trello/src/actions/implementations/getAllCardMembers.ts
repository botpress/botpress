import { wrapAction } from '../action-wrapper'

export const getAllCardMembers = wrapAction(
  { actionName: 'getAllCardMembers' },
  async ({ trelloClient }, { cardId }) => ({
    members: await trelloClient.getCardMembers({ cardId }),
  })
)
