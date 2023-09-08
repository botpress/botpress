import { LinearDocument } from '@linear/sdk'

import { getLinearClient } from '../misc/utils'
import { getIssueFields } from './get-issue'
import { IntegrationProps } from '.botpress'

export const listIssues: IntegrationProps['actions']['listIssues'] = async ({
  client,
  ctx,
  input: { count, startCursor, startDate, teamId },
}) => {
  const linearClient = await getLinearClient(client, ctx.integrationId)

  const query = await linearClient.issues({
    orderBy: LinearDocument.PaginationOrderBy.UpdatedAt,
    first: count || 10,
    after: startCursor,
    filter: {
      updatedAt: startDate ? { gt: new Date(startDate) } : undefined,
      team: teamId ? { id: { eq: teamId } } : undefined,
    },
  })

  const issues = query.nodes.map((issue) => ({
    ...getIssueFields(issue),
    linearIds: {
      issueId: issue.id,
      creatorId: issue['_creator']?.id,
      teamId: issue['_team']?.id,
      assigneeId: issue['_assignee']?.id,
      projectId: issue['_project']?.id,
    },
  }))

  return {
    issues,
    nextCursor: query.pageInfo.hasNextPage ? query.pageInfo.endCursor : undefined,
  }
}
