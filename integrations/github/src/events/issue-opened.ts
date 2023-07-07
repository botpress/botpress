import { Client } from '@botpress/client'
import { IssuesOpenedEvent } from '@octokit/webhooks-types'
import { IssueOpened } from '../definitions/events'

export const fireIssueOpened = async ({ githubEvent, client }: { githubEvent: IssuesOpenedEvent; client: Client }) => {
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
  })
}
