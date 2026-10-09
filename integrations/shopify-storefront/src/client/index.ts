import { RuntimeError } from '@botpress/sdk'
import { SHOPIFY_API_VERSION } from './queries/common'
import * as bp from '.botpress'

type ShopifyAdminClientProps = {
  shopDomain: string
  accessToken: string
}

// Minimal Admin GraphQL client, used only to provision a Storefront Access Token during OAuth.
// Runtime actions use `StorefrontClient` from `./storefront`, not this class.
export class ShopifyAdminClient {
  public readonly shopDomain: string
  private readonly _accessToken: string

  public constructor({ shopDomain, accessToken }: ShopifyAdminClientProps) {
    this.shopDomain = shopDomain
    this._accessToken = accessToken
  }

  public async query<T = unknown>(graphql: string, variables: Record<string, unknown> = {}): Promise<T> {
    const url = `https://${this.shopDomain}.myshopify.com/admin/api/${SHOPIFY_API_VERSION}/graphql.json`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': this._accessToken,
      },
      body: JSON.stringify({ query: graphql, variables }),
    })

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      throw new RuntimeError(`Shopify API error: ${response.status} ${response.statusText} — ${body.slice(0, 500)}`)
    }

    const json = (await response.json()) as { data?: T; errors?: Array<{ message: string }> }

    if (json.errors?.length) {
      throw new RuntimeError(`Shopify GraphQL error: ${json.errors.map((e) => e.message).join(', ')}`)
    }

    return json.data as T
  }
}

/**
 * Exchanges a Shopify OAuth authorization code for an expiring offline Admin access token.
 *
 * Shopify deprecated non-expiring offline tokens for new public apps as of 2026-04-01;
 * `expiring: 1` opts into the supported flow (60-min access TTL, 90-day refresh TTL).
 * This integration uses the token only inside the OAuth wizard to provision a Storefront
 * Access Token, so the access TTL is not material and no refresh logic is needed.
 *
 * See https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/offline-access-tokens
 */
export const exchangeCodeForAccessToken = async ({ shop, code }: { shop: string; code: string }): Promise<string> => {
  const response = await fetch(`https://${shop}.myshopify.com/admin/oauth/access_token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
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

  const json = (await response.json()) as {
    access_token?: string
    scope?: string
    expires_in?: number
    refresh_token?: string
    refresh_token_expires_in?: number
  }

  if (!json.access_token) {
    throw new RuntimeError('Shopify did not return an access_token in the token exchange response')
  }

  return json.access_token
}

/**
 * Requests an Admin access token with the client credentials grant, for apps the merchant created
 * in the Shopify Dev Dashboard (manual setup). The app and the store must belong to the same
 * Shopify organization. Like the OAuth token, it is only used inside the wizard to provision a
 * Storefront Access Token, so its 24-hour TTL doesn't matter.
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
}): Promise<string> => {
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

    const json = (await response.json()) as { access_token?: string }
    if (!json.access_token) {
      throw new RuntimeError('Shopify did not return an access_token in the client credentials response')
    }

    return json.access_token
  } catch (thrown: unknown) {
    if (thrown instanceof RuntimeError) {
      throw thrown
    }
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new RuntimeError(`Failed to get a Shopify access token for ${shop}.myshopify.com: ${error.message}`)
  }
}
