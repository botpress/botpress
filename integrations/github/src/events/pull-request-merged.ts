import { PullRequestClosedEvent } from '@octokit/webhooks-types'
import { getOrCreateBotpressConversationFromGithubPR, getOrCreateBotpressUserFromGithubUser } from '../misc/utils'
import { HandlerProps } from '.botpress'

export const firePullRequesMerged = async ({
  githubEvent,
  client,
}: HandlerProps & {
  githubEvent: PullRequestClosedEvent
}) => {
  const githubPullRequest = { ...githubEvent.pull_request, repository: githubEvent.repository }
  const conversation = await getOrCreateBotpressConversationFromGithubPR({ githubPullRequest, client })
  const user = await getOrCreateBotpressUserFromGithubUser({ githubUser: githubEvent.pull_request.user, client })

  await client.createEvent({
    type: 'pullRequestMerged',
    payload: {
      id: githubEvent.pull_request.id,
      content: githubEvent.pull_request.body ?? '',
      title: githubEvent.pull_request.title,
      baseBranch: githubEvent.pull_request.base.ref,
      targets: {
        pullRequest: githubEvent.pull_request.number.toString(),
      },
      conversationId: conversation.id,
      userId: user.id,
    },
    conversationId: conversation.id,
    userId: user.id,
  })
}
