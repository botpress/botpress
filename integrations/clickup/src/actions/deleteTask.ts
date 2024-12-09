import { wrapAction } from './action-wrapper'

export const deleteTask = wrapAction(
  { actionName: 'deleteTask', errorMessage: 'Failed to delete the task' },
  async ({ clickupClient }, input) => await clickupClient.deleteTask(input)
)
