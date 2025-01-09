import { wrapAction } from '../action-wrapper'

export const getAllProjects = wrapAction(
  { actionName: 'getAllProjects', errorMessageWhenFailed: 'Failed to retrieve projects' },
  async ({ todoistClient }) => ({ projects: await todoistClient.getAllProjects() })
)
