import { Issue } from '@linear/sdk'

import { z } from 'zod'
import { issueSchema } from '../definitions/schemas'
import { getLinearClient } from '../misc/utils'
import { IntegrationProps } from '.botpress'

export const getIssueFields = (issue: Issue): z.infer<typeof issueSchema> => ({
  id: issue.id,
  number: issue.number,
  identifier: issue.identifier,
  title: issue.title,
  description: issue.description,
  priority: issue.priority,
  estimate: issue.estimate,
  url: issue.url,
  createdAt: issue.createdAt.toISOString(),
  updatedAt: issue.updatedAt.toISOString(),
})

export const getIssue: IntegrationProps['actions']['getIssue'] = async ({ client, ctx, input: { issueId } }) => {
  const linearClient = await getLinearClient(client, ctx.integrationId)
  const issue = await linearClient.issue(issueId)

  return getIssueFields(issue)
}
