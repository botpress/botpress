import { getLinearClient } from '../misc/utils'
import * as bp from '.botpress'

export const listStates: bp.IntegrationProps['actions']['listStates'] = async (args) => {
  const {
    ctx,
    input: { count, startCursor },
  } = args

  const linearClient = await getLinearClient(args, ctx.integrationId)
  const states = await linearClient.workflowStates({ after: startCursor, first: count })

  return {
    nextCursor: states.pageInfo.endCursor,
    states: states.nodes.map((state) => {
      return { id: state.id, name: state.name }
    }),
  }
}
