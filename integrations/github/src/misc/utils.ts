import { RuntimeError } from '@botpress/client'
import { GitHubClient } from './github-client'
import * as types from './types'
import * as bp from '.botpress'


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

export const getConversationFromTags = async <E extends keyof types.Channels>(
  client: types.Client,
  tags: Partial<{ channel: E } & Record<keyof bp.channels.Channels[E]['conversation']['tags'], string>>
) => {
  const { conversations } = await client.listConversations({
    tags,
  })

  return conversations.length === 1 ? conversations[0] ?? null : null
}
