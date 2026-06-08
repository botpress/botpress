import { RuntimeError } from '@botpress/sdk'
import { createCommentInputSchema, createCommentOutputSchema } from '../misc/custom-schemas'
import type { Implementation } from '../misc/types'
import { getClient, getErrorMessage, serializeErrorForLog } from '../utils'

export const createComment: Implementation['actions']['createComment'] = async ({ client, ctx, input, logger }) => {
  const validatedInput = createCommentInputSchema.parse(input)
  const jiraClient = await getClient({ client, ctx, logger })

  try {
    const commentId = await jiraClient.addCommentToIssue(validatedInput.issueKey, validatedInput.body)
    logger.forBot().info(`Successful - Create Comment - ${validatedInput.issueKey} - ${commentId}`)
    return createCommentOutputSchema.parse({ issueKey: validatedInput.issueKey, commentId })
  } catch (error) {
    logger.forBot().debug(`'Create Comment' exception ${serializeErrorForLog(error)}`)
    const message = getErrorMessage(error)
    throw new RuntimeError(`Failed to create comment on issue ${validatedInput.issueKey}: ${message}`)
  }
}
