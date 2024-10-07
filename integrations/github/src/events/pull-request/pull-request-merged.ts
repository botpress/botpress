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
      },
      conversationId: conversation.id,
      userId: eventSender.botpressUser,
    })
  },
  errorMessage: 'Failed to handle pull request merged event',
})
