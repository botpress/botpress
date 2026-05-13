import * as bp from '../../.botpress'
import { getn8nClient, wrapn8nError } from './utils'

export const listWorkflows = async ({ ctx, input }: bp.ActionProps['listWorkflows']) => {
  const n8nClient = getn8nClient(ctx.configuration)

  try {
    const { data } = await n8nClient.get('/workflows', {
      params: {
        active: input.active,
        name: input.name,
        tags: input.tags,
        projectId: input.projectId,
        excludePinnedData: input.excludePinnedData,
        limit: input.limit,
        cursor: input.cursor,
      },
    })
    return {
      data: data?.data ?? [],
      nextCursor: data?.nextCursor,
    }
  } catch (error) {
    return wrapn8nError(error)
  }
}
