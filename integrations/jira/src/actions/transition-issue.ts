import { RuntimeError } from '@botpress/sdk'

import { transitionIssueInputSchema, transitionIssueOutputSchema } from '../misc/custom-schemas'
import type { Implementation } from '../misc/types'

import { getClient, getErrorMessage, serializeErrorForLog, textToAdfDocument } from '../utils'

export const transitionIssue: Implementation['actions']['transitionIssue'] = async ({ ctx, input, logger }) => {
  const validatedInput = transitionIssueInputSchema.parse(input)
  const jiraClient = getClient(ctx.configuration)

  try {
    await jiraClient.transitionIssue({
      issueIdOrKey: validatedInput.issueKey,
      transition: { id: validatedInput.transitionId },
      ...(validatedInput.comment !== undefined && {
        update: {
          comment: [{ add: { body: textToAdfDocument(validatedInput.comment) } }],
        },
      }),
    })

    logger
      .forBot()
      .info(`Successful - Transition Issue - ${validatedInput.issueKey} via transition ${validatedInput.transitionId}`)

    return transitionIssueOutputSchema.parse({
      issueKey: validatedInput.issueKey,
      transitionId: validatedInput.transitionId,
    })
  } catch (error) {
    logger.forBot().debug(`'Transition Issue' exception ${serializeErrorForLog(error)}`)
    const message = getErrorMessage(error)
    throw new RuntimeError(
      `Failed to transition issue ${validatedInput.issueKey}: ${message}. Use getIssueTransitions to discover valid transition IDs.`
    )
  }
}
