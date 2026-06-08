import type { JiraApi } from '../client'

export const listFlattenedProjectStatuses = async (jiraClient: JiraApi, projectKey: string) => {
  const response = await jiraClient.listProjectStatuses(projectKey)
  return response.flatMap((typeWithStatus) =>
    (typeWithStatus.statuses ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      category: s.statusCategory?.name,
      issueType: typeWithStatus.name,
    }))
  )
}
