import { PullRequestReviewCommentCreatedEvent } from '@octokit/webhooks-types'
import { wrapEvent } from 'src/misc/event-wrapper'

export const firePullRequestReviewCommentReplied = wrapEvent<
  PullRequestReviewCommentCreatedEvent & { comment: { in_reply_to_id: number } }
>(async ({ githubEvent, client, user }) => {
  const { conversations } = await client.listConversations({
    tags: {
      // @ts-ignore: there seems to be a bug with ToTags<keyof AllChannels<TIntegration>['conversation']['tags']> :
      // it only contains _shared_ tags, as opposed to containing _all_ tags
      pullRequestNodeId: githubEvent.pull_request.node_id,
      fileBeingReviewed: githubEvent.comment.path,
      commitBeingReviewed: githubEvent.comment.commit_id,
      lastCommentId: githubEvent.comment.in_reply_to_id.toString(),
    },
  })

  if (!conversations[0]) {
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
    conversationId: conversations[0].id,
    userId: user.id,
  })
})
