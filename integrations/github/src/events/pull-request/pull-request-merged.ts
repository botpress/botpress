import { PullRequestClosedEvent } from '@octokit/webhooks-types'
import { wrapEvent } from 'src/misc/event-wrapper'
import { getOrCreatePullRequestConversation } from './shared'

export const firePullRequesMerged = wrapEvent<PullRequestClosedEvent>({
  async event({ githubEvent, client, eventSender, mapping }) {
    const conversation = await getOrCreatePullRequestConversation({ githubEvent, client })

    await client.createEvent({
      type: 'pullRequestMerged',
      payload: {
        pullRequest: await mapping.mapPullRequest(githubEvent.pull_request, githubEvent.repository),
        eventSender,

        // The following fields have been kept for backwards compatibility.
        // TODO: Remove these fields in the next major version
        type: 'github:pullRequestMerged',
        baseBranch: githubEvent.pull_request.base.ref,
        content: githubEvent.pull_request.body?.toString() ?? '',
        conversationId: conversation.id,
        id: githubEvent.pull_request.id,
        targets: { pullRequest: githubEvent.pull_request.number.toString() },
        title: githubEvent.pull_request.title,
        userId: githubEvent.pull_request.user.login,
      },
      conversationId: conversation.id,
      userId: eventSender.botpressUser,
    })
  },
  errorMessage: 'Failed to handle pull request merged event',
})
