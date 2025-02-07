import { wrapAction } from '../action-wrapper'

export const changeTaskPriority = wrapAction(
  { actionName: 'changeTaskPriority', errorMessageWhenFailed: 'Failed to change task priority' },
  async ({ todoistClient }, { taskId, priority }) => await todoistClient.updateTask({ task: { id: taskId, priority } })
)
