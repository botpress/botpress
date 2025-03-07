import { randomUUID } from 'crypto'
import { NotionClient } from './notion'
import * as bp from '.botpress'

export const getOAuthToken = async ({ client, ctx }: { client: bp.Client; ctx: bp.Context }) => {
  const { state } = await client.getState({
    id: ctx.integrationId,
    name: 'oauth',
    type: 'integration',
  })

  if (!state?.payload?.access_token) {
    throw new Error('Not connected to Notion')
  }

  return state.payload.access_token
}

export const handleOAuthCallback: bp.IntegrationProps['handler'] = async ({ req, client, ctx }) => {
  const searchParams = new URLSearchParams(req.query)

  const notion = new NotionClient({})
  const response = await notion.oauth.token({
    client_id: bp.secrets.CLIENT_ID,
    client_secret: bp.secrets.CLIENT_SECRET,
    grant_type: 'authorization_code',
    code: searchParams.get('code') ?? '',
    redirect_uri: bp.secrets.REDIRECT_URI,
  })
  await client.getOrSetState({
    type: 'integration',
    name: 'oauth',
    id: ctx.integrationId,
    payload: response as any,
  })

  await client.configureIntegration({
    identifier: randomUUID(),
  })
}
