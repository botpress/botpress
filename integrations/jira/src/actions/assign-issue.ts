import { RuntimeError } from '@botpress/sdk'

import { assignIssueInputSchema, assignIssueOutputSchema } from '../misc/custom-schemas'
import type { Implementation } from '../misc/types'

import { getClient, getErrorMessage, serializeErrorForLog } from '../utils'

export const assignIssue: Implementation['actions']['assignIssue'] = async ({ ctx, input, logger }) => {
  const validatedInput = assignIssueInputSchema.parse(input)
  const jiraClient = getClient(ctx.configuration)

  try {
    await jiraClient.assignIssue(validatedInput.issueKey, validatedInput.accountId)
    logger
      .forBot()
      .info(
        `Successful - Assign Issue - ${validatedInput.issueKey} ${
          validatedInput.accountId === null ? 'unassigned' : `→ ${validatedInput.accountId}`
        }`
      )
    return assignIssueOutputSchema.parse({
      issueKey: validatedInput.issueKey,
      accountId: validatedInput.accountId,
    })
  } catch (error) {
    logger.forBot().debug(`'Assign Issue' exception ${serializeErrorForLog(error)}`)
    const message = getErrorMessage(error)
    throw new RuntimeError(`Failed to assign issue ${validatedInput.issueKey}: ${message}`)
  }
}
