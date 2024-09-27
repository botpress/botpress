import { RuntimeError } from '@botpress/client'
import { GitHubClient } from './github-client'

import * as types from './types'

export const getTagOrThrowException = <R extends Record<string, string>>(tags: R, name: Extract<keyof R, string>) => {
  const value = tags[name]

  if (!value) {
    throw new Error(`Missing tag ${name}`)
  }

  return value
}

type GitHubUser = {
  login: string
  avatar_url: string
  html_url: string
  node_id: string
  id: number
}
export const getOrCreateBotpressUserFromGithubUser = async ({
  githubUser,
  client,
}: {
  githubUser: GitHubUser
  client: types.Client
}) => {
  const { users } = await client.listUsers({
    tags: {
      nodeId: githubUser.node_id,
    },
  })

  if (users.length && users[0]) {
    return users[0]
  }

  const { user } = await client.createUser({
    name: githubUser.login,
    pictureUrl: githubUser.avatar_url,
    tags: {
      handle: githubUser.login,
      nodeId: githubUser.node_id,
      id: githubUser.id.toString(),
      profileUrl: githubUser.html_url,
    },
  })

  return user
}

type GitHubPullRequest = {
  number: number
  node_id: string
  html_url: string
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
export const getOrCreateBotpressConversationFromGithubPR = async ({
  githubPullRequest,
  client,
}: {
  githubPullRequest: GitHubPullRequest
  client: types.Client
}) => {
  const { conversations } = await client.listConversations({
    tags: {
      // @ts-ignore: there seems to be a bug with ToTags<keyof AllChannels<TIntegration>['conversation']['tags']> :
      // it only contains _shared_ tags, as opposed to containing _all_ tags
      pullRequestNodeId: githubPullRequest.node_id,
      channel: 'pullRequest',
    },
  })

  if (conversations.length && conversations[0]) {
    return conversations[0]
  }

  const { conversation } = await client.createConversation({
    channel: 'pullRequest',
    tags: {
      channel: 'pullRequest',
      pullRequestNodeId: githubPullRequest.node_id,
      pullRequestNumber: githubPullRequest.number.toString(),
      pullRequestUrl: githubPullRequest.html_url,
      repoId: githubPullRequest.repository.id.toString(),
      repoName: githubPullRequest.repository.name,
      repoNodeId: githubPullRequest.repository.node_id,
      repoOwnerId: githubPullRequest.repository.owner.id.toString(),
      repoOwnerName: githubPullRequest.repository.owner.login,
      repoOwnerUrl: githubPullRequest.repository.owner.html_url,
      repoUrl: githubPullRequest.repository.html_url,
    },
  })

  return conversation
}

export const configureBotpressNameAndAvatar = async ({
  ctx,
  client,
  gh,
}: {
  ctx: types.Context
  client: types.Client
  gh: GitHubClient
}) => {
  const { id, name, avatarUrl, nodeId, handle, url } = await gh.getAuthenticatedEntity()

  await client.updateUser({
    id: ctx.botUserId,
    tags: { id, handle, nodeId, profileUrl: url },
    name,
    pictureUrl: avatarUrl,
  })
}

export const configureOrganizationHandle = async ({
  ctx,
  client,
  gh,
}: {
  ctx: types.Context
  client: types.Client
  gh: GitHubClient
}) => {
  const { organizationHandle } = await gh.getAuthenticatedEntity()

  await client.setState({
    type: 'integration',
    name: 'configuration',
    id: ctx.integrationId,
    payload: {
      organizationHandle,
    },
  })
}

const _saveInstallationId = async ({
  ctx,
  client,
  installationId,
}: {
  ctx: types.Context
  client: types.Client
  installationId: number
}) => {
  await client.setState({
    type: 'integration',
    name: 'configuration',
    id: ctx.integrationId,
    payload: {
      githubInstallationId: installationId,
    },
  })
}

export const handleOauth = async (req: types.Request, client: types.Client, ctx: types.Context) => {
  const parsedQueryString = new URLSearchParams(req.query)
  const installationIdStr = parsedQueryString.get('installation_id')

  if (!installationIdStr) {
    throw new RuntimeError('Missing installation_id in query string')
  }

  const installationId = Number(installationIdStr)

  await _saveInstallationId({ ctx, client, installationId })
  await client.configureIntegration({ identifier: installationIdStr })
}
