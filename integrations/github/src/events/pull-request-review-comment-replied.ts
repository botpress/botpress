import { PullRequestReviewCommentCreatedEvent } from '@octokit/webhooks-types'
import { getOrCreateBotpressUserFromGithubUser } from '../misc/utils'
import { HandlerProps } from '.botpress'

export const firePullRequestReviewCommentReplied = async ({
  githubEvent,
  client,
  ctx,
}: HandlerProps & {
  githubEvent: PullRequestReviewCommentCreatedEvent & { comment: { in_reply_to_id: number } }
}) => {
  const user = await getOrCreateBotpressUserFromGithubUser({ githubUser: githubEvent.comment.user, client })

  if (user.id === ctx.botUserId) {
    return
  }

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
}
