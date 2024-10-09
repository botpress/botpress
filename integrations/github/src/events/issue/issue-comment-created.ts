import { IssueCommentCreatedEvent } from '@octokit/webhooks-types'
import { wrapEvent } from 'src/misc/event-wrapper'
import { getOrCreateBotpressConversationFromGithubIssue } from './shared'

export const fireIssueCommentCreated = wrapEvent<IssueCommentCreatedEvent>({
  async event({ githubEvent, client, eventSender }) {
    const conversation = await getOrCreateBotpressConversationFromGithubIssue({ githubEvent, client })

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
  errorMessage: 'Failed to handle issue comment created event',
})
