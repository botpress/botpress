import { PullRequestReviewCommentCreatedEvent } from '@octokit/webhooks-types'
import { wrapEvent } from 'src/misc/event-wrapper'

export const firePullRequestReviewCommentCreated = wrapEvent<PullRequestReviewCommentCreatedEvent>({
  async event({ githubEvent, client, eventSender }) {
    const { conversation } = await client.createConversation({
      channel: 'pullRequestReviewComment',
      tags: {
        pullRequestNodeId: githubEvent.pull_request.node_id,
        pullRequestNumber: githubEvent.pull_request.number.toString(),
        pullRequestUrl: githubEvent.pull_request.html_url,
        repoId: githubEvent.repository.id.toString(),
        repoName: githubEvent.repository.name,
        repoNodeId: githubEvent.repository.node_id,
        repoOwnerId: githubEvent.repository.owner.id.toString(),
        repoOwnerName: githubEvent.repository.owner.login,
        repoOwnerUrl: githubEvent.repository.owner.html_url,
        repoUrl: githubEvent.repository.html_url,
        fileBeingReviewed: githubEvent.comment.path,
        commitBeingReviewed: githubEvent.comment.commit_id,
        lineBeingReviewed: githubEvent.comment.line?.toString(),
        reviewThreadUrl: githubEvent.comment.html_url,
        lastCommentId: githubEvent.comment.id.toString(),
      },
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
  errorMessage: 'Failed to handle pull request review comment created event',
})
