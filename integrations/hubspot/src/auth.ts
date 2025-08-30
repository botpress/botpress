import { RuntimeError } from '@botpress/sdk'
import { Client as HubspotClient } from '@hubspot/api-client'
import * as bp from '.botpress'

const FIVE_MINUTES_IN_SECONDS = 300
const REDIRECT_URI = `${process.env.BP_WEBHOOK_URL}/oauth`

type OAuthCredentials = {
  accessToken: string
  refreshToken: string
  expiresAtSeconds: number
}

const _getExpiresAtFromExpiresIn = (expiresIn: number) => {
  const nowSeconds = Date.now() / 1000
  return nowSeconds + expiresIn
}

export const exchangeCodeForOAuthCredentials = async ({ code }: { code: string }) => {
  const hsClient = new HubspotClient({})
  const { refreshToken, accessToken, expiresIn } = await hsClient.oauth.tokensApi.create(
    'authorization_code',
    code,
    REDIRECT_URI,
    bp.secrets.CLIENT_ID,
    bp.secrets.CLIENT_SECRET
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
      payload: { accessToken, refreshToken, expiresAtSeconds },
    },
  } = await client.getState({ type: 'integration', name: 'oauthCredentials', id: ctx.integrationId })
  const nowSeconds = Date.now() / 1000
  if (nowSeconds >= expiresAtSeconds - FIVE_MINUTES_IN_SECONDS) {
    const hsClient = new HubspotClient({})
    const refreshResponse = await hsClient.oauth.tokensApi.create(
      'refresh_token',
      undefined,
      REDIRECT_URI,
      bp.secrets.CLIENT_ID,
      bp.secrets.CLIENT_SECRET,
      refreshToken
    )
    const newCredentials = {
      accessToken: refreshResponse.accessToken,
      refreshToken: refreshResponse.refreshToken,
      expiresAtSeconds: _getExpiresAtFromExpiresIn(refreshResponse.expiresIn),
    }
    await setOAuthCredentials({
      client,
      ctx,
      credentials: newCredentials,
    })
    return newCredentials.accessToken
  }

  return accessToken
}

const _getAccessToken = async ({ client, ctx }: { client: bp.Client; ctx: bp.Context }) => {
  let accessToken: string | undefined
  if (ctx.configurationType === 'manual') {
    accessToken = ctx.configuration.accessToken
  } else {
    accessToken = await _getOrRefreshOAuthAccessToken({ client, ctx })
  }

  if (!accessToken) {
    throw new RuntimeError('Access token not found in saved credentials')
  }

  return accessToken
}

export const getAuthenticatedHubspotClient = async ({ client, ctx }: { client: bp.Client; ctx: bp.Context }) => {
  const accessToken = await _getAccessToken({ client, ctx })
  return new HubspotClient({ accessToken })
}
