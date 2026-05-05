import { LinearError, LinearErrorType } from '@linear/sdk'
import { getLinearClient } from '../misc/utils'
import * as bp from '.botpress'

export const deleteIssue: bp.IntegrationProps['actions']['deleteIssue'] = async (args) => {
  const {
    input: { id: issueId },
  } = args

  const linearClient = await getLinearClient(args)

  const existingIssue = await linearClient.issue(issueId).catch((thrown) => {
    if (thrown instanceof LinearError && thrown.type === LinearErrorType.InvalidInput) {
      return undefined
    }
    throw thrown
  })

  if (!existingIssue) {
    args.logger.warn(`Issue "${issueId}" not found`)
    return {}
  }

  await linearClient.deleteIssue(issueId)
  return {}
}
