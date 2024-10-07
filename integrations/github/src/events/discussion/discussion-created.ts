import { DiscussionCreatedEvent } from '@octokit/webhooks-types'
import { wrapEvent } from 'src/misc/event-wrapper'
import { getOrCreateDiscussionConversation } from './shared'

export const fireDiscussionCreated = wrapEvent<DiscussionCreatedEvent>({
  async event({ githubEvent, client, eventSender }) {
    const conversation = await getOrCreateDiscussionConversation({
      githubEvent,
      client,
    })

    await client.createMessage({
      tags: {
        commentId: githubEvent.discussion.id.toString(),
        commentNodeId: githubEvent.discussion.node_id,
        commentUrl: githubEvent.discussion.html_url,
      },
      type: 'text',
      payload: {
        text: githubEvent.discussion.body,
      },
      conversationId: conversation.id,
      userId: eventSender.botpressUser,
    })
  },
  errorMessage: 'Failed to handle discussion created event',
})
