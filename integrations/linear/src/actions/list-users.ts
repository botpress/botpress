import { LinearDocument } from '@linear/sdk'

import { getLinearClient } from '../misc/utils'
import { IntegrationProps } from '.botpress'

export const listUsers: IntegrationProps['actions']['listUsers'] = async ({
  client,
  ctx,
  input: { count, startCursor },
}) => {
  const linearClient = await getLinearClient(client, ctx.integrationId)

  const query = await linearClient.users({
    orderBy: LinearDocument.PaginationOrderBy.UpdatedAt,
    first: count || 10,
    after: startCursor,
  })

  const users = query.nodes.map((user) => ({
    ...user,
    lastSeen: user.lastSeen ? user.lastSeen.toISOString() : undefined,
    updatedAt: user.updatedAt.toISOString(),
  }))

  return {
    users,
    nextCursor: query.pageInfo.hasNextPage ? query.pageInfo.endCursor : undefined,
  }
}
