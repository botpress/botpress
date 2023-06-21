import { Issue } from '@linear/sdk'

import { Implementation } from '../misc/types'
import { getLinearClient } from '../misc/utils'

export const getIssueFields = (issue: Issue) => ({
  id: issue.id,
  number: issue.number,
  identifier: issue.identifier,
  title: issue.title,
  description: issue.description,
  priority: issue.priority,
  url: issue.url,
  createdAt: issue.createdAt.toISOString(),
  updatedAt: issue.updatedAt.toISOString(),
})

export const getIssue: Implementation['actions']['getIssue'] = async ({ client, ctx, input: { issueId } }) => {
  const linearClient = await getLinearClient(client, ctx.integrationId)
  const issue = await linearClient.issue(issueId)

  return getIssueFields(issue)
}
