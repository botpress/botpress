import { RuntimeError } from '@botpress/sdk'
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

export const setCredentialsState = async ({
  client,
  ctx,
  credentials,
}: {
  client: bp.Client
  ctx: bp.Context
  credentials: ShopifyCredentials
}) => {
  const { state } = await client
    .getState({ type: 'integration', name: 'credentials', id: ctx.integrationId })
    .catch(() => ({ state: { payload: {} as Record<string, unknown> } }))

  await client.setState({
    type: 'integration',
    name: 'credentials',
    id: ctx.integrationId,
    payload: { ...state.payload, ...credentials },
  })
}

/**
 * Returns valid credentials, refreshing the access token pre-emptively when within
 * REFRESH_BUFFER_SECONDS of expiry. Pass `force: true` from a 401-retry path to skip
 * the cached-expiry check (the server is the source of truth that the token is bad).
 * Throws a re-authorize prompt if the refresh token itself has expired (90-day TTL)
 * or if any required field is missing from state.
 */
export const getOrRefreshCredentials = async ({
  client,
  ctx,
  force = false,
}: {
  client: bp.Client
  ctx: bp.Context
  force?: boolean
}): Promise<ShopifyCredentials> => {
  const { state } = await client.getState({ type: 'integration', name: 'credentials', id: ctx.integrationId })
  const { shopDomain, accessToken, refreshToken, accessTokenExpiresAtSeconds, refreshTokenExpiresAtSeconds } =
    state.payload

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
    return { shopDomain, accessToken, refreshToken, accessTokenExpiresAtSeconds, refreshTokenExpiresAtSeconds }
  }

  const refreshed = await refreshAccessToken({ shop: shopDomain, refreshToken })
  const next: ShopifyCredentials = { shopDomain, ...refreshed }
  await setCredentialsState({ client, ctx, credentials: next })
  return next
}
