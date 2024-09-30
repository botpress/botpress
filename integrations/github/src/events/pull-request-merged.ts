import { PullRequestClosedEvent } from '@octokit/webhooks-types'
import { wrapEvent } from 'src/misc/event-wrapper'
import { getOrCreateBotpressConversationFromGithubPR } from '../misc/utils'

export const firePullRequesMerged = wrapEvent<PullRequestClosedEvent>(async ({ githubEvent, client, user }) => {
  const githubPullRequest = { ...githubEvent.pull_request, repository: githubEvent.repository }
  const conversation = await getOrCreateBotpressConversationFromGithubPR({ githubPullRequest, client })

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
})
