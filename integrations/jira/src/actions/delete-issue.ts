import { RuntimeError } from '@botpress/sdk'

import { deleteIssueInputSchema, deleteIssueOutputSchema } from '../misc/custom-schemas'
import type { Implementation } from '../misc/types'

import { getClient } from '../utils'

export const deleteIssue: Implementation['actions']['deleteIssue'] = async ({ ctx, input, logger }) => {
  const validatedInput = deleteIssueInputSchema.parse(input)
  const jiraClient = getClient(ctx.configuration)

  try {
    await jiraClient.deleteIssue(validatedInput.issueKey, validatedInput.deleteSubtasks ?? false)
    logger.forBot().info(`Successful - Delete Issue - ${validatedInput.issueKey}`)
    return deleteIssueOutputSchema.parse({ issueKey: validatedInput.issueKey })
  } catch (error) {
    logger.forBot().debug(`'Delete Issue' exception ${JSON.stringify(error)}`)
    const message = error instanceof Error ? error.message : JSON.stringify(error)
    throw new RuntimeError(`Failed to delete issue ${validatedInput.issueKey}: ${message}`)
  }
}
