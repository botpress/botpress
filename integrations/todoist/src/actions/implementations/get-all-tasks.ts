import { wrapAction } from '../action-wrapper'

export const getAllTasks = wrapAction(
  { actionName: 'getAllTasks', errorMessageWhenFailed: 'Failed to retrieve tasks' },
  async ({ todoistClient }, { projectId, labelName, sectionId }) => ({
    tasks: await todoistClient.getAllTasks({ projectId, labelName, sectionId }),
  })
)
