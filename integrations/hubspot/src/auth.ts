import { RuntimeError, isApiError } from '@botpress/sdk'
import { Client as OfficialHubspotClient } from '@hubspot/api-client'
import { getEnvironment, useDeskOAuth } from './utils'
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

const _getOAuthAppCredentials = (useDesk: boolean) => ({
  clientId: useDesk ? bp.secrets.DESK_CLIENT_ID : bp.secrets.CLIENT_ID,
  clientSecret: useDesk ? bp.secrets.DESK_CLIENT_SECRET : bp.secrets.CLIENT_SECRET,
})

export const exchangeCodeForOAuthCredentials = async ({ code, useDesk }: { code: string; useDesk: boolean }) => {
  const { clientId, clientSecret } = _getOAuthAppCredentials(useDesk)
  const hsClient = new OfficialHubspotClient({})
  const { refreshToken, accessToken, expiresIn } = await hsClient.oauth.tokensApi.create(
    'authorization_code',
    code,
    REDIRECT_URI,
    clientId,
    clientSecret
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

  const environment = await getEnvironment({ client, ctx })
  const { clientId, clientSecret } = _getOAuthAppCredentials(useDeskOAuth(environment))
  const hsClient = new OfficialHubspotClient({})
  const refreshResponse = await hsClient.oauth.tokensApi.create(
    'refresh_token',
    undefined,
    REDIRECT_URI,
    clientId,
    clientSecret,
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

export const getAccessToken = async ({ client, ctx }: { client: bp.Client; ctx: bp.Context }) => {
  if (ctx.configurationType === 'manual') {
    const { accessToken } = ctx.configuration
    if (!accessToken) {
      throw new RuntimeError('Access token not found in saved credentials')
    }
    return accessToken
  }

  return _getOrRefreshOAuthAccessToken({ client, ctx })
}

export const getClientSecret = async ({ client, ctx }: { client: bp.Client; ctx: bp.Context }) => {
  let clientSecret: string | undefined
  if (ctx.configurationType === 'manual') {
    clientSecret = ctx.configuration.clientSecret
  } else {
    const environment = await getEnvironment({ client, ctx })
    clientSecret = useDeskOAuth(environment) ? bp.secrets.DESK_CLIENT_SECRET : bp.secrets.CLIENT_SECRET
  }
  return clientSecret?.length ? clientSecret : undefined
}
