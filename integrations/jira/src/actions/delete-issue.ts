import { RuntimeError } from '@botpress/sdk'

import { deleteIssueInputSchema, deleteIssueOutputSchema } from '../misc/custom-schemas'
import type { Implementation } from '../misc/types'

import { getClient, getErrorMessage, serializeErrorForLog } from '../utils'

export const deleteIssue: Implementation['actions']['deleteIssue'] = async ({ ctx, input, logger }) => {
  const validatedInput = deleteIssueInputSchema.parse(input)
  const jiraClient = getClient(ctx.configuration)

  try {
    await jiraClient.deleteIssue(validatedInput.issueKey, validatedInput.deleteSubtasks ?? false)
    logger.forBot().info(`Successful - Delete Issue - ${validatedInput.issueKey}`)
    return deleteIssueOutputSchema.parse({ issueKey: validatedInput.issueKey })
  } catch (error) {
    logger.forBot().debug(`'Delete Issue' exception ${serializeErrorForLog(error)}`)
    const message = getErrorMessage(error)
    throw new RuntimeError(`Failed to delete issue ${validatedInput.issueKey}: ${message}`)
  }
}
