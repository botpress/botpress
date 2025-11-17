import * as authWizard from '@botpress/common/src/oauth-wizard'
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
  // chore: that's a lot of getState calls
  const { state } = await client.getState({
    type: 'integration',
    name: 'oauth',
    id: ctx.integrationId,
  })

  const bambooHrOauthUrl = `https://${state.payload.domain}.bamboohr.com/token.php?request=token`

  const { OAUTH_CLIENT_SECRET, OAUTH_CLIENT_ID } = bp.secrets

  // See https://documentation.bamboohr.com/docs/getting-started
  const requestTimestamp = Date.now()

  const body = JSON.stringify({
    client_id: OAUTH_CLIENT_ID,
    client_secret: OAUTH_CLIENT_SECRET,
    redirect_uri: authWizard.getWizardStepUrl('oauth-callback').href, // issue: this will call botpress webhook
    ...('code' in oAuthInfo
      ? { grant_type: 'authorization_code', code: oAuthInfo.code }
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

  await client.setState({
    type: 'integration',
    name: 'oauth',
    id: ctx.integrationId,
    payload: {
      domain: state.payload.domain,
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt: requestTimestamp + expires_in * 1000 - OAUTH_EXPIRATION_MARGIN,
      scopes: scope,
    },
  })

  console.log('access_token', access_token)
  console.log('id_token', id_token)

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
  if (ctx.configurationType === 'manual') {
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
    Date.now() < oauth.expiresAt // chore: redundant check
      ? oauth.accessToken
      : (await fetchBambooHrOauthToken({ ctx, client }, oauth)).accessToken

  return { authorization: `Bearer ${token}`, expiresAt: oauth.expiresAt }
}

/** Handles OAuth endpoint on integration authentication.
 *
 * Exchanges code for token, saves token in state, and configures integration with identifier and subdomain.
 */
export const handleOauthRequest = async ({ ctx, client, req, logger }: bp.HandlerProps) => {
  const code = new URLSearchParams(req.query).get('code')
  if (!code) throw new Error('Missing authentication code')

  const { idToken } = await fetchBambooHrOauthToken({ ctx, client }, { code })

  // Extract subdomain from the JWT token
  const decodedToken = jwt.decode(idToken) as JwtPayload
  const subdomain = decodedToken.sub

  await client.configureIntegration({
    identifier: subdomain,
  })

  logger.forBot().info('BambooHR OAuth authentication successfully set up.')
}
