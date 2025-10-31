import { bambooHrOauthTokenResponse } from 'definitions'
import jwt, { type JwtPayload } from 'jsonwebtoken'
import * as bp from '.botpress'

const OAUTH_EXPIRATION_MARGIN = 5 * 60 * 1000 // 5 minutes

/** Fetches OAuth token from BambooHR.
 *
 * Can use either authorization code or refresh token.
 * Saves new token in state.
 * @returns `accessToken` and `idToken` to use in Authorization header and integration configuration respectively.
 */
const fetchBambooHrOauthToken = async (
  { ctx, client }: Pick<bp.HandlerProps, 'ctx' | 'client'>,
  oAuthInfo: { code: string } | { refreshToken: string }
): Promise<{
  accessToken: string
  idToken: string
}> => {
  const bambooHrOauthUrl = `https://${ctx.configuration.subdomain}.bamboohr.com/token.php?request=token`

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

  await client.setState({
    type: 'integration',
    name: 'oauth',
    id: ctx.integrationId,
    payload: {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt: requestTimestamp + expires_in * 1000 - OAUTH_EXPIRATION_MARGIN,
      scopes: scope,
    },
  })

  return { accessToken: access_token, idToken: id_token }
}

/** Gets authorization information for requests.
 *
 * Can be either API key or OAuth token, depending on configuration.
 * If OAuth token is expired or missing, fetches a new one using the refresh token.
 * Users should refresh their authorization header periodically based on the `expiresAt` timestamp.
 *
 * @returns Authorization information & an expiration timestamp.
 */
export const getBambooHrAuthorization = async ({
  ctx,
  client,
}: Pick<bp.HandlerProps, 'ctx' | 'client'>): Promise<{ authorization: string; expiresAt: number }> => {
  if (ctx.configurationType === 'apiKey') {
    return {
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

  const token =
    Date.now() < oauth.expiresAt
      ? oauth.accessToken
      : (await fetchBambooHrOauthToken({ ctx, client }, oauth)).accessToken

  return { authorization: `Bearer ${token}`, expiresAt: oauth.expiresAt }
}

/** Handles OAuth endpoint on integration authentication.
 *
 * Exchanges code for token, saves token in state, and configures integration with identifier.
 */
export const handleOauthRequest = async ({ ctx, client, req, logger }: bp.HandlerProps) => {
  const code = new URLSearchParams(req.query).get('code')
  if (!code) throw new Error('Missing authentication code')

  const { idToken } = await fetchBambooHrOauthToken({ ctx, client }, { code })

  await client.configureIntegration({
    identifier: (jwt.decode(idToken) as JwtPayload).sub,
  })

  logger.forBot().info('BambooHR OAuth authentication successfully set up.')
}
