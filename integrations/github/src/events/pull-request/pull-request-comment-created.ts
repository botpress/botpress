import { IssueCommentCreatedEvent } from '@octokit/webhooks-types'
import { wrapEvent } from 'src/misc/event-wrapper'
import { getOrCreatePullRequestConversation } from './shared'

export const firePullRequestCommentCreated = wrapEvent<IssueCommentCreatedEvent>({
  async event({ githubEvent, client, eventSender }) {
    const conversation = await getOrCreatePullRequestConversation({
      githubEvent: {
        ...githubEvent,
        pull_request: githubEvent.issue,
      },
      client,
    })

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
      userId: eventSender.botpressUser,
    })
  },
  errorMessage: 'Failed to handle pull request comment created event',
})
