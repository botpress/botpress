import { IssuesOpenedEvent } from '@octokit/webhooks-types'
import { wrapEvent } from 'src/misc/event-wrapper'
import { getOrCreateBotpressConversationFromGithubIssue } from './shared'

export const fireIssueOpened = wrapEvent<IssuesOpenedEvent>({
  async event({ githubEvent, client, eventSender, mapping }) {
    const conversation = await getOrCreateBotpressConversationFromGithubIssue({ githubEvent, client })

    await client.createEvent({
      type: 'issueOpened',
      payload: {
        issue: await mapping.mapIssue(githubEvent.issue, githubEvent.repository),
        eventSender,

        // The following fields have been kept for backwards compatibility.
        // TODO: Remove these fields in the next major version
        content: githubEvent.issue.body,
        id: githubEvent.issue.id,
        issueUrl: githubEvent.issue.html_url,
        number: githubEvent.issue.number,
        repositoryName: githubEvent.repository.name,
        repositoryOwner: githubEvent.repository.owner.login,
        repoUrl: githubEvent.repository.html_url,
        title: githubEvent.issue.title,
      },
      userId: eventSender.botpressUser,
      conversationId: conversation.id,
    })
  },
  errorMessage: 'Failed to handle issue opened event',
})
