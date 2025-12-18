import { getLinearClient } from '../misc/utils'
import * as bp from '.botpress'

export const resolveComment: bp.IntegrationProps['actions']['resolveComment'] = async (args) => {
  const {
    ctx,
    input: { id },
  } = args

  const linearClient = await getLinearClient(args, ctx.integrationId)

  const { success } = await linearClient.commentResolve(id)

  return { success }
}
