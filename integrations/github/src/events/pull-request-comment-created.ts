import { IssueCommentCreatedEvent } from '@octokit/webhooks-types'
import { getOrCreateBotpressConversationFromGithubPR, getOrCreateBotpressUserFromGithubUser } from '../misc/utils'
import { HandlerProps } from '.botpress'

export const firePullRequestCommentCreated = async ({
  githubEvent,
  client,
  ctx,
}: HandlerProps & {
  githubEvent: IssueCommentCreatedEvent
}) => {
  const githubPullRequest = { ...githubEvent.issue, repository: githubEvent.repository }
  const conversation = await getOrCreateBotpressConversationFromGithubPR({ githubPullRequest, client })
  const user = await getOrCreateBotpressUserFromGithubUser({ githubUser: githubEvent.comment.user, client })

  if (user.id === ctx.botUserId) {
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
    userId: user.id,
  })
}
