import { IssuesOpenedEvent } from '@octokit/webhooks-types'
import { wrapEvent } from 'src/misc/event-wrapper'
import { getOrCreateBotpressConversationFromGithubIssue } from './shared'

export const fireIssueOpened = wrapEvent<IssuesOpenedEvent>(async ({ githubEvent, client, eventSender, mapping }) => {
  const conversation = await getOrCreateBotpressConversationFromGithubIssue({ githubEvent, client })

  await client.createEvent({
    type: 'issueOpened',
    payload: {
      issue: await mapping.mapIssue(githubEvent.issue, githubEvent.repository),
      eventSender,
    },
    userId: eventSender.botpressUser,
    conversationId: conversation.id,
  })
})
