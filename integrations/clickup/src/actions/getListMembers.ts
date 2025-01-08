import { wrapAction } from './action-wrapper'

export const getListMembers = wrapAction(
  { actionName: 'getListMembers', errorMessage: 'Failed to create a new task' },
  async ({ clickupClient }, input) => {
    const members = await clickupClient.getListMembers(input)
    return { members }
  }
)
