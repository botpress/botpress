import { RuntimeError } from '@botpress/sdk'

import { getIssueTransitionsInputSchema, getIssueTransitionsOutputSchema } from '../misc/custom-schemas'
import type { Implementation } from '../misc/types'

import { getClient } from '../utils'

export const getIssueTransitions: Implementation['actions']['getIssueTransitions'] = async ({
  ctx,
  input,
  logger,
}) => {
  const validatedInput = getIssueTransitionsInputSchema.parse(input)
  const jiraClient = getClient(ctx.configuration)

  try {
    const response = await jiraClient.getIssueTransitions({
      issueIdOrKey: validatedInput.issueKey,
      includeUnavailableTransitions: true,
    })

    const transitions = (response.transitions ?? []).map((t) => ({
      id: t.id ?? '',
      name: t.name,
      toStatus: t.to?.name,
      toStatusCategory: t.to?.statusCategory?.name,
      isAvailable: t.isAvailable,
      hasScreen: t.hasScreen,
    }))

    logger.forBot().info(`Successful - Get Issue Transitions - ${transitions.length} for ${validatedInput.issueKey}`)
    return getIssueTransitionsOutputSchema.parse({ transitions })
  } catch (error) {
    logger.forBot().debug(`'Get Issue Transitions' exception ${JSON.stringify(error)}`)
    const message = error instanceof Error ? error.message : JSON.stringify(error)
    throw new RuntimeError(`Failed to get transitions for ${validatedInput.issueKey}: ${message}`)
  }
}
