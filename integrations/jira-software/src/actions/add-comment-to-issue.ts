import { addCommentToIssueInputSchema } from '../misc/custom-schemas'
import type { Implementation } from '../misc/types'

import { getClient } from '../utils'

export const addCommentToIssue: Implementation['actions']['addCommentToIssue'] =
  async ({ ctx, input, logger }) => {
    const validatedInput = addCommentToIssueInputSchema.parse(input)
    const jiraClient = getClient(ctx.configuration)
    const comment = {
      issueIdOrKey: validatedInput.issueKey,
      body: validatedInput.body,
    }
    let response
    try {
      response = await jiraClient.addCommentToIssue(comment)
      logger
        .forBot()
        .info(
          `Successful - Add Comment to Issue - with issueKey: ${validatedInput.issueKey} - id: ${response}`
        )
    } catch (error) {
      response = ''
      logger
        .forBot()
        .debug(`'Add Comment to Issue' exception ${JSON.stringify(error)}`)
    }
    return { id: response }
  }
