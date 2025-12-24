import { RuntimeError } from '@botpress/client'
import { getLinearClient } from '../misc/utils'
import * as bp from '.botpress'

export const listStates: bp.IntegrationProps['actions']['listStates'] = async (args) => {
  const {
    ctx,
    input: { count, startCursor },
  } = args

  const linearClient = await getLinearClient(args, ctx.integrationId)

  try {
    const states = await linearClient.workflowStates({ after: startCursor, first: count })
    return {
      nextCursor: states.pageInfo.endCursor,
      states: states.nodes.map((state) => {
        return { id: state.id, name: state.name }
      }),
    }
  } catch (thrown: unknown) {
    const msg = thrown instanceof Error ? thrown.message : String(thrown)
    throw new RuntimeError(`Failed to list states: ${msg}`)
  }
}
