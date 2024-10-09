import { PullRequestReviewSubmittedEvent } from '@octokit/webhooks-types'
import { wrapEvent } from 'src/misc/event-wrapper'
import { getOrCreatePullRequestConversation } from './shared'

export const firePullRequestReviewSubmitted = wrapEvent<PullRequestReviewSubmittedEvent>({
  async event({ githubEvent, client, eventSender, mapping }) {
    const conversation = await getOrCreatePullRequestConversation({
      githubEvent: {
        ...githubEvent,
        pull_request: githubEvent.pull_request,
      },
      client,
    })

    const messageId = githubEvent.review.body
      ? (
          await client.createMessage({
            tags: {
              commentId: githubEvent.review.id.toString(),
              commentNodeId: githubEvent.review.node_id,
              commentUrl: githubEvent.review.html_url,
            },
            type: 'text',
            payload: {
              text: githubEvent.review.body,
            },
            conversationId: conversation.id,
            userId: eventSender.botpressUser,
          })
        ).message.id
      : undefined

    await client.createEvent({
      type: 'pullRequestReviewSubmitted',
      payload: {
        review: await mapping.mapPullRequestReview(githubEvent.review, githubEvent.pull_request),
        eventSender,
      },
      conversationId: conversation.id,
      messageId,
      userId: eventSender.botpressUser,
    })
  },
  errorMessage: 'Failed to handle pull request review submitted event',
})
