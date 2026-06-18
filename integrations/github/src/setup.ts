import { GitHubClient } from './misc/github-client'
import { RegisterFunction, UnregisterFunction } from './misc/types'
import * as bp from '.botpress'

export const register: RegisterFunction = async ({ ctx, client }) => {
  const gh = await GitHubClient.create({ ctx, client })

  await _configureBotpressNameAndAvatar({ ctx, client, gh })
  await _configureOrganizationHandle({ ctx, client, gh })
}

export const unregister: UnregisterFunction = async (_) => {}

const _configureBotpressNameAndAvatar = async ({
  ctx,
  client,
  gh,
}: {
  ctx: bp.Context
  client: bp.Client
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

const _configureOrganizationHandle = async ({
  ctx,
  client,
  gh,
}: {
  ctx: bp.Context
  client: bp.Client
  gh: GitHubClient
}) => {
  const { organizationHandle } = await gh.getAuthenticatedEntity()

  // Merge with the existing configuration state so we don't clobber the
  // githubInstallationId saved by the OAuth callback (setState replaces the
  // whole payload).
  const existing = await _readConfigurationState({ ctx, client })

  await client.setState({
    type: 'integration',
    name: 'configuration',
    id: ctx.integrationId,
    payload: {
      ...existing,
      organizationHandle,
    },
  })
}

const _readConfigurationState = async ({
  ctx,
  client,
}: {
  ctx: bp.Context
  client: bp.Client
}): Promise<{ githubInstallationId?: number; organizationHandle?: string }> => {
  try {
    const { state } = await client.getState({ type: 'integration', name: 'configuration', id: ctx.integrationId })
    return state.payload ?? {}
  } catch {
    return {}
  }
}
