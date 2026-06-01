import { RuntimeError } from '@botpress/sdk'
import type { Channels } from '../misc/types'
import { getClient } from '../utils'

export const channels: Channels = {
  issueComments: {
    messages: {
      text: async ({ client, ctx, payload, conversation, ack, logger }) => {
        const issueKey = conversation.tags.issueKey
        if (!issueKey) {
          throw new RuntimeError('Issue key must be set on the Jira issue comments conversation')
        }

        const jiraClient = await getClient({ client, ctx, logger })
        try {
          const commentId = await jiraClient.addCommentToIssue(issueKey, payload.text)
          logger.forBot().info(`Successful - Add Jira issue comment - ${issueKey} - ${commentId}`)
          await ack({ tags: { commentId } })
        } catch (error) {
          logger.forBot().debug(`'Add Jira issue comment' exception ${JSON.stringify(error)}`)
          const message = error instanceof Error ? error.message : JSON.stringify(error)
          throw new RuntimeError(`Failed to add Jira issue comment: ${message}`)
        }
      },
    },
  },
}
