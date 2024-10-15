import { getConversationFromTags } from 'src/misc/utils'
import * as bp from '.botpress'

type GitHubPullRequest = {
  issue: {
    number: number
    node_id: string
    html_url: string
  }
  repository: {
    id: number
    name: string
    node_id: string
    owner: {
      id: number
      login: string
      html_url: string
    }
    html_url: string
  }
}
export const getOrCreateBotpressConversationFromGithubIssue = async ({
  githubEvent,
  client,
}: {
  githubEvent: GitHubPullRequest
  client: bp.Client
}) =>
  (await getConversationFromTags<'issue'>(client, { issueNodeId: githubEvent.issue.node_id })) ??
  (
    await client.createConversation({
      channel: 'issue',
      tags: {
        issueNodeId: githubEvent.issue.node_id,
        issueNumber: githubEvent.issue.number.toString(),
        issueUrl: githubEvent.issue.html_url,
        repoId: githubEvent.repository.id.toString(),
        repoName: githubEvent.repository.name,
        repoNodeId: githubEvent.repository.node_id,
        repoOwnerId: githubEvent.repository.owner.id.toString(),
        repoOwnerName: githubEvent.repository.owner.login,
        repoOwnerUrl: githubEvent.repository.owner.html_url,
        repoUrl: githubEvent.repository.html_url,
      },
    })
  ).conversation
