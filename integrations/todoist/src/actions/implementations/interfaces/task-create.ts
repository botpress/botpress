import { wrapAction } from '../../action-wrapper'

export const taskCreate = wrapAction(
  { actionName: 'taskCreate', errorMessageWhenFailed: 'Failed to create task' },
  async ({ todoistClient }, { item }) => ({ item: await todoistClient.createNewTask({ task: item }) })
)
