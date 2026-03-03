import { RuntimeError, isApiError } from '@botpress/sdk'
import { Client as OfficialHubspotClient } from '@hubspot/api-client'
import * as bp from '.botpress'

const FIVE_MINUTES_IN_SECONDS = 300
const REDIRECT_URI = `${process.env.BP_WEBHOOK_URL}/oauth`

type OAuthCredentials = {
  accessToken: string
  refreshToken: string
  expiresAtSeconds: number
  clientId?: string
  clientSecret?: string
}

const _getExpiresAtFromExpiresIn = (expiresIn: number) => {
  const nowSeconds = Date.now() / 1000
  return nowSeconds + expiresIn
}

export const exchangeCodeForOAuthCredentials = async ({
  code,
  clientId,
  clientSecret,
}: {
  code: string
  clientId?: string
  clientSecret?: string
}) => {
  const hsClient = new OfficialHubspotClient({})
  const { refreshToken, accessToken, expiresIn } = await hsClient.oauth.tokensApi.create(
    'authorization_code',
    code,
    REDIRECT_URI,
    clientId ?? bp.secrets.CLIENT_ID,
    clientSecret ?? bp.secrets.CLIENT_SECRET
  )
  return {
    refreshToken,
    accessToken,
    expiresAtSeconds: _getExpiresAtFromExpiresIn(expiresIn),
  }
}

export const setOAuthCredentials = async ({
  client,
  ctx,
  credentials,
}: {
  client: bp.Client
  ctx: bp.Context
  credentials: OAuthCredentials
}) => {
  await client.setState({
    type: 'integration',
    name: 'oauthCredentials',
    id: ctx.integrationId,
    payload: credentials,
  })
}

const _getOrRefreshOAuthAccessToken = async ({ client, ctx }: { client: bp.Client; ctx: bp.Context }) => {
  const {
    state: {
      payload: { accessToken, refreshToken, expiresAtSeconds, clientId, clientSecret },
    },
  } = await client
    .getState({ type: 'integration', name: 'oauthCredentials', id: ctx.integrationId })
    .catch((e: unknown) => {
      if (isApiError(e) && e.code === 404) {
        throw new RuntimeError('OAuth credentials not found, please reauthorize')
      }
      throw e
    })
  const nowSeconds = Date.now() / 1000
  if (nowSeconds <= expiresAtSeconds - FIVE_MINUTES_IN_SECONDS) {
    return accessToken
  }

  // Use stored client credentials if available (manual config), otherwise use secrets (OAuth)
  const effectiveClientId = clientId ?? bp.secrets.CLIENT_ID
  const effectiveClientSecret = clientSecret ?? bp.secrets.CLIENT_SECRET

  const hsClient = new OfficialHubspotClient({})
  const refreshResponse = await hsClient.oauth.tokensApi.create(
    'refresh_token',
    undefined,
    REDIRECT_URI,
    effectiveClientId,
    effectiveClientSecret,
    refreshToken
  )
  const newCredentials = {
    accessToken: refreshResponse.accessToken,
    refreshToken: refreshResponse.refreshToken,
    expiresAtSeconds: _getExpiresAtFromExpiresIn(refreshResponse.expiresIn),
    clientId,
    clientSecret,
  }
  await setOAuthCredentials({
    client,
    ctx,
    credentials: newCredentials,
  })
  return newCredentials.accessToken
}

export const getAccessToken = async ({ client, ctx }: { client: bp.Client; ctx: bp.Context }) => {
  let accessToken: string | undefined

  // Try OAuth state first (used by both OAuth and manual config wizard)
  try {
    accessToken = await _getOrRefreshOAuthAccessToken({ client, ctx })
  } catch (error) {
    // Fall back to manual config access token if OAuth state doesn't exist
    // This maintains backwards compatibility with old-style manual config
    if (ctx.configurationType === 'manual' && ctx.configuration.accessToken) {
      accessToken = ctx.configuration.accessToken
    } else {
      throw error
    }
  }

  if (!accessToken) {
    throw new RuntimeError('Access token not found in saved credentials')
  }

  return accessToken
}

export const getClientSecret = (ctx: bp.Context) => {
  let clientSecret: string | undefined
  if (ctx.configurationType === 'manual') {
    clientSecret = ctx.configuration.clientSecret
  } else {
    clientSecret = bp.secrets.CLIENT_SECRET
  }
  return clientSecret?.length ? clientSecret : undefined
}
