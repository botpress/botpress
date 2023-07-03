import { LinearDocument } from '@linear/sdk'

import { Implementation } from '../misc/types'
import { getLinearClient } from '../misc/utils'
import { getIssueFields } from './get-issue'

export const listIssues: Implementation['actions']['listIssues'] = async ({
  client,
  ctx,
  input: { count, startCursor, startDate, teamId },
}) => {
  const linearClient = await getLinearClient(client, ctx.integrationId)

  const query = await linearClient.issues({
    orderBy: LinearDocument.PaginationOrderBy.CreatedAt,
    first: count || 10,
    after: startCursor,
    filter: {
      createdAt: startDate ? { gt: new Date(startDate) } : undefined,
      team: teamId ? { id: { eq: teamId } } : undefined,
    },
  })

  const issues = query.nodes.map(getIssueFields)

  return {
    issues,
    nextCursor: query.pageInfo.hasNextPage ? query.pageInfo.endCursor : undefined,
  }
}
