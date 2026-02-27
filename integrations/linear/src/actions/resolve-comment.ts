import { getLinearClient } from '../misc/utils'
import * as bp from '.botpress'

export const resolveComment: bp.IntegrationProps['actions']['resolveComment'] = async (args) => {
  const {
    input: { id },
  } = args

  const linearClient = await getLinearClient(args)

  try {
    const { success } = await linearClient.commentResolve(id)
    return { success }
  } catch (thrown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    args.logger.error('An error occured while trying to resolve comment: ', error.message)
    return { success: false }
  }
}
