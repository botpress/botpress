import { z } from '@botpress/sdk'
import { Issue } from '@linear/sdk'

import { issueSchema } from '../definitions/schemas'
import { getLinearClient } from '../misc/utils'
import * as bp from '.botpress'

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

export const getIssue: bp.IntegrationProps['actions']['getIssue'] = async ({ client, ctx, input: { issueId } }) => {
  const linearClient = await getLinearClient(client, ctx.integrationId)
  const issue = await linearClient.issue(issueId)

  return getIssueFields(issue)
}
