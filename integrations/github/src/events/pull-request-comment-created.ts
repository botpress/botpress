import { IssueCommentCreatedEvent } from '@octokit/webhooks-types'
import { wrapEvent } from 'src/misc/event-wrapper'
import { getOrCreateBotpressConversationFromGithubPR } from '../misc/utils'

export const firePullRequestCommentCreated = wrapEvent<IssueCommentCreatedEvent>(
  async ({ githubEvent, client, user }) => {
    const githubPullRequest = { ...githubEvent.issue, repository: githubEvent.repository }
    const conversation = await getOrCreateBotpressConversationFromGithubPR({ githubPullRequest, client })

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
  }
)
