import { LinearDocument } from '@linear/sdk'

import { getLinearClient } from '../misc/utils'
import * as bp from '.botpress'

export const listUsers: bp.IntegrationProps['actions']['listUsers'] = async (args) => {
  const {
    ctx,
    input: { count, startCursor },
  } = args
  const linearClient = await getLinearClient(args, ctx.integrationId)

  const query = await linearClient.users({
    orderBy: LinearDocument.PaginationOrderBy.UpdatedAt,
    first: count || 10,
    after: startCursor,
  })

  const users: bp.actions.listUsers.output.Output['users'] = query.nodes.map((user) => ({
    ...user,
    lastSeen: user.lastSeen?.toISOString(),
    updatedAt: user.updatedAt,
  }))

  return {
    users,
    nextCursor: query.pageInfo.hasNextPage ? query.pageInfo.endCursor : undefined,
  }
}
