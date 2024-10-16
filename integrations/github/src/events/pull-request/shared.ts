import { getConversationFromTags } from 'src/misc/utils'
import * as bp from '.botpress'

type GitHubPullRequest = {
  pull_request: {
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

export const getOrCreatePullRequestConversation = async ({
  githubEvent,
  client,
}: {
  githubEvent: GitHubPullRequest
  client: bp.Client
}) =>
  (await getConversationFromTags<'pullRequest'>(client, {
    channel: 'pullRequest',
    pullRequestNodeId: githubEvent.pull_request.node_id,
  })) ?? (await _createPullRequestConversation({ githubEvent, client }))

const _createPullRequestConversation = async ({
  githubEvent,
  client,
}: {
  githubEvent: GitHubPullRequest
  client: bp.Client
}) => {
  const { conversation } = await client.createConversation({
    channel: 'pullRequest',
    tags: {
      channel: 'pullRequest',
      pullRequestNodeId: githubEvent.pull_request.node_id,
      pullRequestNumber: githubEvent.pull_request.number.toString(),
      pullRequestUrl: githubEvent.pull_request.html_url,
      repoId: githubEvent.repository.id.toString(),
      repoName: githubEvent.repository.name,
      repoNodeId: githubEvent.repository.node_id,
      repoOwnerId: githubEvent.repository.owner.id.toString(),
      repoOwnerName: githubEvent.repository.owner.login,
      repoOwnerUrl: githubEvent.repository.owner.html_url,
      repoUrl: githubEvent.repository.html_url,
    },
  })

  return conversation
}
