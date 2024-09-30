import { PullRequestOpenedEvent } from '@octokit/webhooks-types'

import { wrapEvent } from 'src/misc/event-wrapper'
import { getOrCreatePullRequestConversation } from './shared'

export const firePullRequestOpened = wrapEvent<PullRequestOpenedEvent>(
  async ({ githubEvent, client, eventSender, mapping }) => {
    const conversation = await getOrCreatePullRequestConversation({ githubEvent, client })

    await client.createEvent({
      type: 'pullRequestOpened',
      payload: {
        pullRequest: await mapping.mapPullRequest(githubEvent.pull_request, githubEvent.repository),
        eventSender,
      },
      conversationId: conversation.id,
      userId: eventSender.botpressUser,
    })
  }
)
