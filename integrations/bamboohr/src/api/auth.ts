import { bambooHrOauthTokenResponse } from 'definitions'
import jwt, { type JwtPayload } from 'jsonwebtoken'
import * as bp from '.botpress'
import * as types from '../types'

const OAUTH_EXPIRATION_MARGIN = 5 * 60 * 1000 // 5 minutes

const _fetchBambooHrOauthToken = async (props: {
  subdomain?: string
  oAuthInfo: { code: string } | { refreshToken: string }
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
  const tokenResponse = await fetch(bambooHrOauthUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      AcceptHeaderParameter: 'application/json',
    },
    body: JSON.stringify({
      client_id: OAUTH_CLIENT_ID,
      client_secret: OAUTH_CLIENT_SECRET,
      redirect_uri: 'https://webhook.botpress.cloud/oauth',
      ...('code' in oAuthInfo
        ? { grant_type: 'authorization_code', code: oAuthInfo.code }
        : { grant_type: 'refresh_token', refresh_token: oAuthInfo.refreshToken }),
    }),
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

export type BambooHRAuthorization = { authorization: string; expiresAt: number } & (
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
  if (ctx.configurationType === 'apiKey') {
    return {
      type: 'apiKey',
      authorization: `Basic ${Buffer.from(ctx.configuration.apiKey + ':x').toString('base64')}`,
      expiresAt: Infinity,
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
  }
}

export const refreshBambooHrAuthorization = async (
  { ctx, client }: types.CommonHandlerProps,
  previousAuth: BambooHRAuthorization
): Promise<BambooHRAuthorization> => {
  if (previousAuth.type === 'apiKey') {
    return previousAuth
  }

  let oauth = previousAuth

  const { accessToken, expiresAt, refreshToken, scopes } = await _fetchBambooHrOauthToken({
    subdomain: ctx.configuration.subdomain,
    oAuthInfo: { refreshToken: oauth.refreshToken },
  })

  await client.setState({
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
  }
}

/** Handles OAuth endpoint on integration authentication.
 *
 * Exchanges code for token, saves token in state, and configures integration with identifier.
 */
export const handleOauthRequest = async ({ ctx, client, req, logger }: bp.HandlerProps) => {
  const code = new URLSearchParams(req.query).get('code')
  if (!code) throw new Error('Missing authentication code')

  const { idToken, ...oauthState } = await _fetchBambooHrOauthToken({
    subdomain: ctx.configuration.subdomain, // TODO: use the wizard provided value
    oAuthInfo: { code },
  })

  await client.setState({
    type: 'integration',
    name: 'oauth',
    id: ctx.integrationId,
    payload: oauthState,
  })

  await client.configureIntegration({
    identifier: (jwt.decode(idToken) as JwtPayload).sub,
  })

  logger.forBot().info('BambooHR OAuth authentication successfully set up.')
}
