import { wrapAction } from '../action-wrapper'

export const getTaskId = wrapAction(
  { actionName: 'getTaskId', errorMessageWhenFailed: 'Failed to retrieve task id' },
  async ({ todoistClient }, { name }) => {
    const task = await todoistClient.getTaskByName({ name })

    return { taskId: task?.id ?? null }
  }
)
