import { IssueCommentCreatedEvent } from '@octokit/webhooks-types'
import { wrapEvent } from 'src/misc/event-wrapper'
import { getOrCreateBotpressConversationFromGithubIssue } from '../misc/utils'

export const fireIssueCommentCreated = wrapEvent<IssueCommentCreatedEvent>(async ({ githubEvent, client, user }) => {
  const githubIssue = { ...githubEvent.issue, repository: githubEvent.repository }
  const conversation = await getOrCreateBotpressConversationFromGithubIssue({ githubIssue, client })

  await client.createMessage({
    tags: {
      commentId: githubEvent.comment.id.toString(),
      commentNodeId: githubEvent.comment.node_id,
      commentUrl: githubEvent.comment.html_url,
    },
    type: 'text',
    payload: {
      text: githubEvent.comment.body,
    },
    conversationId: conversation.id,
    userId: user.id,
  })
})
