import { DiscussionCommentCreatedEvent, DiscussionEvent } from '@octokit/webhooks-types'
import { wrapEvent } from 'src/misc/event-wrapper'
import { getOrCreateDiscussionConversation } from './shared'

export const fireDiscussionCommentCreated = wrapEvent<DiscussionCommentCreatedEvent>({
  async event({ githubEvent, client, eventSender }) {
    const conversation = await getOrCreateDiscussionConversation({
      githubEvent: githubEvent as DiscussionEvent,
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
  errorMessage: 'Failed to handle discussion comment created event',
})
