import { IssuesOpenedEvent } from '@octokit/webhooks-types'
import { wrapEvent } from 'src/misc/event-wrapper'
import { IssueOpened } from '../../definitions/events'
import { getOrCreateBotpressConversationFromGithubIssue } from './shared'

export const fireIssueOpened = wrapEvent<IssuesOpenedEvent>(async ({ githubEvent, client, user }) => {
  const conversation = await getOrCreateBotpressConversationFromGithubIssue({ githubEvent, client })

  const payload: IssueOpened = {
    id: githubEvent.issue.id,
    number: githubEvent.issue.number,
    title: githubEvent.issue.title,
    content: githubEvent.issue.body,
    issueUrl: githubEvent.issue.url,
    repoUrl: githubEvent.repository.url,
    repositoryName: githubEvent.repository.name,
    repositoryOwner: githubEvent.repository.owner.login,
  }

  await client.createEvent({
    type: 'issueOpened',
    payload,
    userId: user.id,
    conversationId: conversation.id,
  })
})
