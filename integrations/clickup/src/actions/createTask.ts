import { wrapAction } from './action-wrapper'

export const createTask = wrapAction(
  { actionName: 'createTask', errorMessage: 'Failed to create a new task' },
  async ({ clickupClient }, input) => {
    const { dueDate, ...rest } = input
    const task = await clickupClient.createTask({
      ...rest,
      dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
    })
    return { taskId: task.id.toString() }
  }
)
