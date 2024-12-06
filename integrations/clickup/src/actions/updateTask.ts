import { wrapAction } from './action-wrapper'

export const updateTask = wrapAction(
  { actionName: 'updateTask', errorMessage: 'Failed to update the task' },
  async ({ clickupClient }, input) => {
    const { dueDate, assigneesToAdd, assigneesToRemove, ...rest } = input
    const task = await clickupClient.updateTask({
      ...rest,
      assignees: { add: assigneesToAdd ?? [], rem: assigneesToRemove ?? [] },
      dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
    })
    return { taskId: task.id.toString() }
  }
)
