import { wrapAction } from '../action-wrapper'

export const getAllSections = wrapAction(
  { actionName: 'getAllSections', errorMessageWhenFailed: 'Failed to retrieve sections' },
  async ({ todoistClient }, { projectId }) => ({ sections: await todoistClient.getAllSections({ projectId }) })
)
