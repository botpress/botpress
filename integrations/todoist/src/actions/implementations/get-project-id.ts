import { wrapAction } from '../action-wrapper'

export const getProjectId = wrapAction(
  { actionName: 'getProjectId', errorMessageWhenFailed: 'Failed to retrieve project id' },
  async ({ todoistClient }, { name }) => {
    const project = await todoistClient.getProjectByName({ name })

    return { projectId: project?.id ?? null }
  }
)
