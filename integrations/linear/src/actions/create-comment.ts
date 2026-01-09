import { RuntimeError } from '@botpress/client'
import { getLinearClient } from '../misc/utils'
import * as bp from '.botpress'

export const createComment: bp.IntegrationProps['actions']['createComment'] = async (args) => {
  const {
    ctx,
    input: { issueId, body },
  } = args

  const linearClient = await getLinearClient(args, ctx.integrationId)

  try {
    const { success } = await linearClient.createComment({ body, issueId })
    return { success }
  } catch (thrown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new RuntimeError(`An error occured while trying to create a comment: ${error.message}`)
  }
}
