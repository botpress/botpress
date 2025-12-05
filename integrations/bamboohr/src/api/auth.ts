import { bambooHrOauthTokenResponse } from 'definitions'
import * as types from '../types'
import * as bp from '.botpress'

const OAUTH_EXPIRATION_MARGIN = 5 * 60 * 1000 // 5 minutes

const _fetchBambooHrOauthToken = async (props: {
  subdomain: string
  oAuthInfo: { code: string; redirectUri: string } | { refreshToken: string }
}): Promise<{
  accessToken: string
  refreshToken: string
  expiresAt: number
  scopes: string
  idToken: string
}> => {
  const { subdomain, oAuthInfo } = props
  const bambooHrOauthUrl = `https://${subdomain}.bamboohr.com/token.php?request=token`

  const { OAUTH_CLIENT_SECRET, OAUTH_CLIENT_ID } = bp.secrets

  // See https://documentation.bamboohr.com/docs/getting-started
  const requestTimestamp = Date.now()

  const body = JSON.stringify({
    client_id: OAUTH_CLIENT_ID,
    client_secret: OAUTH_CLIENT_SECRET,
    ...('code' in oAuthInfo
      ? { grant_type: 'authorization_code', code: oAuthInfo.code, redirect_uri: oAuthInfo.redirectUri }
      : { grant_type: 'refresh_token', refresh_token: oAuthInfo.refreshToken }),
  })

  const tokenResponse = await fetch(bambooHrOauthUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body,
  })

  if (tokenResponse.status < 200 || tokenResponse.status >= 300) {
    throw new Error(
      `Failed POST request for OAuth token: ${tokenResponse.status} ${tokenResponse.statusText} at ${bambooHrOauthUrl} with ${'code' in oAuthInfo ? oAuthInfo.code : oAuthInfo.refreshToken}`
    )
  }

  const tokenData = bambooHrOauthTokenResponse.safeParse(await tokenResponse.json())
  if (!tokenData.success) {
    throw new Error(`Failed parse OAuth token response: ${tokenData.error.message}`)
  }
  const { access_token, refresh_token, expires_in, scope, id_token } = tokenData.data

  return {
    accessToken: access_token,
    refreshToken: refresh_token,
    expiresAt: requestTimestamp + expires_in * 1000 - OAUTH_EXPIRATION_MARGIN,
    scopes: scope,
    idToken: id_token,
  }
}

export type BambooHRAuthorization = { authorization: string; expiresAt: number; domain: string } & (
  | {
      type: 'apiKey'
    }
  | {
      type: 'oauth'
      refreshToken: string
    }
)

export const getCurrentBambooHrAuthorization = async ({
  ctx,
  client,
}: types.CommonHandlerProps): Promise<BambooHRAuthorization> => {
  if (ctx.configurationType === 'manual') {
    return {
      type: 'apiKey',
      authorization: `Basic ${Buffer.from(ctx.configuration.apiKey + ':x').toString('base64')}`,
      expiresAt: Infinity,
      domain: ctx.configuration.subdomain,
    }
  }

  let oauth: bp.states.States['oauth']['payload']
  try {
    const { state } = await client.getState({
      type: 'integration',
      name: 'oauth',
      id: ctx.integrationId,
    })
    oauth = state.payload
  } catch (err) {
    throw new Error('OAuth token missing in state for OAuth-linked integration.', { cause: err })
  }

  return {
    type: 'oauth',
    authorization: `Bearer ${oauth.accessToken}`,
    expiresAt: oauth.expiresAt,
    refreshToken: oauth.refreshToken,
    domain: oauth.domain,
  }
}

export const refreshBambooHrAuthorization = async (
  { ctx, client }: types.CommonHandlerProps,
  previousAuth: BambooHRAuthorization
): Promise<BambooHRAuthorization> => {
  // Return the previous authorization if it is an API key
  if (previousAuth.type === 'apiKey') {
    return previousAuth
  }

  const oauth = previousAuth

  const { accessToken, expiresAt, refreshToken, scopes } = await _fetchBambooHrOauthToken({
    subdomain: oauth.domain,
    oAuthInfo: { refreshToken: oauth.refreshToken },
  })

  await client.patchState({
    type: 'integration',
    name: 'oauth',
    id: ctx.integrationId,
    payload: {
      accessToken,
      refreshToken,
      expiresAt,
      scopes,
    },
  })

  return {
    type: 'oauth',
    authorization: `Bearer ${accessToken}`,
    expiresAt: oauth.expiresAt,
    refreshToken,
    domain: oauth.domain,
  }
}

/** Handles OAuth endpoint on integration authentication.
 *
 * Exchanges code for token, saves token in state, and configures integration with identifier and subdomain.
 */
export const handleOauthRequest = async ({ ctx, client, req, logger }: bp.HandlerProps, subdomain: string) => {
  const code = new URLSearchParams(req.query).get('code')
  const redirectUri = new URLSearchParams(req.query).get('redirect_uri')

  if (!code || !redirectUri) throw new Error('Missing authentication code or redirect URI')
  if (!subdomain) throw new Error('Subdomain is required')

  const { ...oauthState } = await _fetchBambooHrOauthToken({
    subdomain,
    oAuthInfo: { code, redirectUri },
  }).catch((thrown) => {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new Error('Failed to fetch BambooHR OAuth token: ' + error.message)
  })

  await client.setState({
    type: 'integration',
    name: 'oauth',
    id: ctx.integrationId,
    payload: { ...oauthState, domain: subdomain },
  })

  await client.configureIntegration({
    identifier: subdomain,
  })

  logger.forBot().info('BambooHR OAuth authentication successfully set up.')
}
