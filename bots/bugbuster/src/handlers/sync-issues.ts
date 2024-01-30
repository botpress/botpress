import { Handler } from './typings'

/**
 * checks if all issues in GitHub are assigned to someone
 * if not, sends a DM to the owner of the bot
 */
export const handleSyncIssuesRequest: Handler<'syncIssuesRequest'> = async ({ client, ctx }) => {
  const { ownerSlackId } = ctx.configuration
  if (!ownerSlackId || typeof ownerSlackId !== 'string') {
    console.info('No owner Slack ID configured')
    return
  }

  const {
    output: { targets: githubIssues },
  } = await client.callAction({
    type: 'github:findTarget',
    input: {
      channel: 'issue',
      query: '',
    },
  })

  const unassignedIssues = githubIssues
    .map((issue) =>
      issue.tags['id']
        ? {
            displayName: issue.displayName,
            id: issue.tags['id'],
            assigneeId: issue.tags['assigneeId'],
          }
        : null
    )
    .filter(<T>(i: T | null): i is T => i !== null)
    .filter((issue) => !issue.assigneeId)

  const {
    output: { conversationId },
  } = await client.callAction({
    type: 'slack:startDmConversation',
    input: {
      slackUserId: ownerSlackId,
    },
  })

  const message = [
    'The following issues are not assigned in GitHub:',
    ...unassignedIssues.map((issue) => `\t${issue.displayName}`),
  ].join('\n')

  await client.createMessage({
    conversationId,
    userId: ctx.botId,
    tags: {},
    type: 'text',
    payload: {
      text: message,
    },
  })
}
