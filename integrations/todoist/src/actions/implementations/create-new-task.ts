import { wrapAction } from '../action-wrapper'

export const createNewTask = wrapAction(
  { actionName: 'createNewTask', errorMessageWhenFailed: 'Failed to create task' },
  async ({ todoistClient }, task) => {
    const newTask = await todoistClient.createNewTask({ task })

    return { taskId: newTask.id }
  }
)
