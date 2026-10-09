import { isApiError, RuntimeError } from '@botpress/sdk'
import * as bp from '.botpress'

const REFRESH_BUFFER_SECONDS = 300

const _nowSeconds = () => Math.floor(Date.now() / 1000)

export type ShopifyCredentials = {
  shopDomain: string
  accessToken: string
  refreshToken: string
  accessTokenExpiresAtSeconds: number
  refreshTokenExpiresAtSeconds: number
}

export type ShopifyAccess = Pick<ShopifyCredentials, 'shopDomain' | 'accessToken'>

export type CredentialsStatePayload = bp.states.credentials.Credentials['payload']

type TokenResponse = {
  access_token?: string
  scope?: string
  expires_in?: number
  refresh_token?: string
  refresh_token_expires_in?: number
}

const _parseTokenResponse = (json: TokenResponse) => {
  if (!json.access_token || !json.refresh_token || !json.expires_in || !json.refresh_token_expires_in) {
    throw new RuntimeError('Shopify token response is missing one or more required expiring-token fields')
  }
  const now = _nowSeconds()
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    accessTokenExpiresAtSeconds: now + json.expires_in,
    refreshTokenExpiresAtSeconds: now + json.refresh_token_expires_in,
  }
}

/**
 * Exchanges a Shopify OAuth authorization code for an expiring offline Admin access token bundle.
 *
 * Shopify deprecated non-expiring offline tokens for new public apps as of 2026-04-01;
 * `expiring: 1` opts into the supported flow (60-min access TTL, 90-day refresh TTL).
 *
 * See https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/offline-access-tokens
 */
export const exchangeCodeForAccessToken = async ({
  shop,
  code,
}: {
  shop: string
  code: string
}): Promise<Omit<ShopifyCredentials, 'shopDomain'>> => {
  const response = await fetch(`https://${shop}.myshopify.com/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: bp.secrets.SHOPIFY_CLIENT_ID,
      client_secret: bp.secrets.SHOPIFY_CLIENT_SECRET,
      code,
      expiring: 1,
    }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new RuntimeError(
      `Failed to exchange authorization code for access token: ${response.status} ${response.statusText} — ${body.slice(0, 500)}`
    )
  }

  return _parseTokenResponse((await response.json()) as TokenResponse)
}

/**
 * Refreshes an expiring offline Admin access token using the stored refresh token.
 * Shopify rotates the refresh token on every refresh — the response always contains a new pair.
 */
export const refreshAccessToken = async ({
  shop,
  refreshToken,
}: {
  shop: string
  refreshToken: string
}): Promise<Omit<ShopifyCredentials, 'shopDomain'>> => {
  const response = await fetch(`https://${shop}.myshopify.com/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: bp.secrets.SHOPIFY_CLIENT_ID,
      client_secret: bp.secrets.SHOPIFY_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new RuntimeError(
      `Failed to refresh Shopify admin access token: ${response.status} ${response.statusText} — ${body.slice(0, 500)}. Refresh token may have expired (90-day TTL); re-authorize the integration.`
    )
  }

  return _parseTokenResponse((await response.json()) as TokenResponse)
}

/**
 * Requests an Admin access token with the client credentials grant, for apps the merchant created
 * in the Shopify Dev Dashboard (manual configuration). The app and the store must belong to the
 * same Shopify organization. Tokens last 24 hours and there is no refresh token; call this again
 * to get a new one. Scopes come from the installed app version, not from this request.
 *
 * See https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/client-credentials-grant
 */
export const fetchClientCredentialsToken = async ({
  shop,
  clientId,
  clientSecret,
}: {
  shop: string
  clientId: string
  clientSecret: string
}): Promise<Pick<ShopifyCredentials, 'accessToken' | 'accessTokenExpiresAtSeconds'>> => {
  try {
    const response = await fetch(`https://${shop}.myshopify.com/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }).toString(),
    })

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      throw new RuntimeError(
        `Failed to get a Shopify access token with the provided Client ID and Client Secret: ${response.status} ${response.statusText} — ${body.slice(0, 500)}. Check the credentials and that the app is installed on ${shop}.myshopify.com.`
      )
    }

    const json = (await response.json()) as TokenResponse
    if (!json.access_token || !json.expires_in) {
      throw new RuntimeError('Shopify client credentials response is missing access_token or expires_in')
    }

    return {
      accessToken: json.access_token,
      accessTokenExpiresAtSeconds: _nowSeconds() + json.expires_in,
    }
  } catch (thrown: unknown) {
    if (thrown instanceof RuntimeError) {
      throw thrown
    }
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new RuntimeError(`Failed to get a Shopify access token for ${shop}.myshopify.com: ${error.message}`)
  }
}

// Callers pass the full payload they already read (merged with the new token fields) rather than
// having this re-read state: a failed re-read would otherwise drop the stored shop and app credentials.
const _saveCredentialsState = async ({
  client,
  ctx,
  payload,
}: {
  client: bp.Client
  ctx: bp.Context
  payload: CredentialsStatePayload
}) => {
  try {
    await client.setState({ type: 'integration', name: 'credentials', id: ctx.integrationId, payload })
  } catch (thrown: unknown) {
    if (thrown instanceof RuntimeError) {
      throw thrown
    }
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new RuntimeError(`Failed to save Shopify credentials: ${error.message}`)
  }
}

/**
 * Returns a shop domain and a valid Admin access token for however the store was connected
 * in the wizard. Pass `force: true` from a 401-retry path to skip the cached-expiry check
 * (the server is the source of truth that the token is bad).
 */
export const getOrRefreshCredentials = async ({
  client,
  ctx,
  force = false,
}: {
  client: bp.Client
  ctx: bp.Context
  force?: boolean
}): Promise<ShopifyAccess> => {
  const payload = await getCredentialsState({ client, ctx })
  if (payload.authMethod === 'manual') {
    return await _getOrFetchManualCredentials({ client, ctx, payload, force })
  }
  return await _getOrRefreshOAuthCredentials({ client, ctx, payload, force })
}

export const getCredentialsState = async ({
  client,
  ctx,
}: {
  client: bp.Client
  ctx: bp.Context
}): Promise<CredentialsStatePayload> => {
  try {
    const { state } = await client.getState({ type: 'integration', name: 'credentials', id: ctx.integrationId })
    return state.payload
  } catch (thrown: unknown) {
    // No state yet means nothing has been connected. Any other failure is unexpected and must not be
    // mistaken for "no credentials", or callers would fall back to OAuth defaults for a manual store.
    if (isApiError(thrown) && thrown.type === 'ResourceNotFound') {
      return {}
    }
    throw thrown
  }
}

/**
 * Manual setup: returns the cached client credentials token, or requests a new one when it is
 * within REFRESH_BUFFER_SECONDS of expiry. The token is cached in the credentials state so
 * actions don't request a new one on every call.
 */
const _getOrFetchManualCredentials = async ({
  client,
  ctx,
  payload,
  force,
}: {
  client: bp.Client
  ctx: bp.Context
  payload: CredentialsStatePayload
  force: boolean
}): Promise<ShopifyAccess> => {
  try {
    const { shopDomain, clientId, clientSecret, accessToken, accessTokenExpiresAtSeconds } = payload
    if (!shopDomain || !clientId || !clientSecret) {
      throw new RuntimeError(
        'Shopify app credentials not found or incomplete; reconnect the integration via the wizard.'
      )
    }

    if (
      !force &&
      accessToken &&
      accessTokenExpiresAtSeconds !== undefined &&
      _nowSeconds() < accessTokenExpiresAtSeconds - REFRESH_BUFFER_SECONDS
    ) {
      return { shopDomain, accessToken }
    }

    const fetched = await fetchClientCredentialsToken({ shop: shopDomain, clientId, clientSecret })
    await _saveCredentialsState({ client, ctx, payload: { ...payload, ...fetched } })
    return { shopDomain, accessToken: fetched.accessToken }
  } catch (thrown: unknown) {
    if (thrown instanceof RuntimeError) {
      throw thrown
    }
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new RuntimeError(`Failed to get Shopify credentials for the manually connected store: ${error.message}`)
  }
}

/**
 * OAuth: returns valid credentials, refreshing the access token pre-emptively when within
 * REFRESH_BUFFER_SECONDS of expiry.
 * Throws a re-authorize prompt if the refresh token itself has expired (90-day TTL)
 * or if any required field is missing from state.
 */
const _getOrRefreshOAuthCredentials = async ({
  client,
  ctx,
  payload,
  force,
}: {
  client: bp.Client
  ctx: bp.Context
  payload: CredentialsStatePayload
  force: boolean
}): Promise<ShopifyAccess> => {
  const { shopDomain, accessToken, refreshToken, accessTokenExpiresAtSeconds, refreshTokenExpiresAtSeconds } = payload

  if (
    !shopDomain ||
    !accessToken ||
    !refreshToken ||
    accessTokenExpiresAtSeconds === undefined ||
    refreshTokenExpiresAtSeconds === undefined
  ) {
    throw new RuntimeError(
      'Shopify credentials not found or incomplete; re-authorize the integration via the OAuth wizard.'
    )
  }

  const now = _nowSeconds()
  if (now >= refreshTokenExpiresAtSeconds) {
    throw new RuntimeError(
      'Shopify refresh token expired (90-day TTL); re-authorize the integration via the OAuth wizard.'
    )
  }

  if (!force && now < accessTokenExpiresAtSeconds - REFRESH_BUFFER_SECONDS) {
    return { shopDomain, accessToken }
  }

  const refreshed = await refreshAccessToken({ shop: shopDomain, refreshToken })
  await _saveCredentialsState({ client, ctx, payload: { ...payload, ...refreshed } })
  return { shopDomain, accessToken: refreshed.accessToken }
}
