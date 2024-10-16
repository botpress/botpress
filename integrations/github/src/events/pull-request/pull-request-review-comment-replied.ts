import { PullRequestReviewCommentCreatedEvent } from '@octokit/webhooks-types'
import { wrapEvent } from 'src/misc/event-wrapper'
import { getConversationFromTags } from 'src/misc/utils'

export const firePullRequestReviewCommentReplied = wrapEvent<
  PullRequestReviewCommentCreatedEvent & { comment: { in_reply_to_id: number } }
>({
  async event({ githubEvent, client, eventSender }) {
    const conversation = await getConversationFromTags<'pullRequestReviewComment'>(client, {
      pullRequestNodeId: githubEvent.pull_request.node_id,
      fileBeingReviewed: githubEvent.comment.path,
      commitBeingReviewed: githubEvent.comment.commit_id,
      lastCommentId: githubEvent.comment.in_reply_to_id.toString(),
    })

    if (!conversation) {
      return
    }

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
  errorMessage: 'Failed to handle pull request review comment replied event',
})
