import { IssuesOpenedEvent } from '@octokit/webhooks-types'
import { wrapEvent } from 'src/misc/event-wrapper'
import { getOrCreateBotpressConversationFromGithubIssue } from './shared'

export const fireIssueOpened = wrapEvent<IssuesOpenedEvent>(async ({ githubEvent, client, user }) => {
  const conversation = await getOrCreateBotpressConversationFromGithubIssue({ githubEvent, client })

  await client.createEvent({
    type: 'issueOpened',
    payload: {
      id: githubEvent.issue.id,
      number: githubEvent.issue.number,
      title: githubEvent.issue.title,
      content: githubEvent.issue.body,
      issueUrl: githubEvent.issue.url,
      repoUrl: githubEvent.repository.url,
      repositoryName: githubEvent.repository.name,
      repositoryOwner: githubEvent.repository.owner.login,
    },
    userId: user.id,
    conversationId: conversation.id,
  })
})
