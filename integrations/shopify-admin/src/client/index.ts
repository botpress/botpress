import { RuntimeError } from '@botpress/sdk'
import { WEBHOOK_SUBSCRIPTION_CREATE, WEBHOOK_SUBSCRIPTION_DELETE } from './queries/admin'
import { SHOPIFY_API_VERSION } from './queries/common'
import * as bp from '.botpress'

type ShopifyClientProps = {
  shopDomain: string
  accessToken: string
}

type CreateProps = {
  client: bp.Client
  ctx: bp.Context
}

type WebhookSubscriptionCreateResponse = {
  webhookSubscriptionCreate: {
    webhookSubscription: { id: string } | null
    userErrors: Array<{ field: string[] | null; message: string }>
  }
}

type WebhookSubscriptionDeleteResponse = {
  webhookSubscriptionDelete: {
    deletedWebhookSubscriptionId: string | null
    userErrors: Array<{ field: string[] | null; message: string }>
  }
}

export class ShopifyClient {
  public readonly shopDomain: string
  private readonly _accessToken: string

  public constructor({ shopDomain, accessToken }: ShopifyClientProps) {
    this.shopDomain = shopDomain
    this._accessToken = accessToken
  }

  public static async create({ client, ctx }: CreateProps): Promise<ShopifyClient> {
    const { state } = await client.getState({ type: 'integration', name: 'credentials', id: ctx.integrationId })

    if (!state.payload.shopDomain || !state.payload.accessToken) {
      throw new RuntimeError('Shopify credentials not found. Please complete the OAuth flow first.')
    }

    return new ShopifyClient({
      shopDomain: state.payload.shopDomain,
      accessToken: state.payload.accessToken,
    })
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
      throw new RuntimeError(`Shopify API error: ${response.status} ${response.statusText}`)
    }

    const json = (await response.json()) as { data?: T; errors?: Array<{ message: string }> }

    if (json.errors?.length) {
      throw new RuntimeError(`Shopify GraphQL error: ${json.errors.map((e) => e.message).join(', ')}`)
    }

    return json.data as T
  }

  public async subscribeWebhook(topic: string, uri: string): Promise<string | null> {
    const data = await this.query<WebhookSubscriptionCreateResponse>(WEBHOOK_SUBSCRIPTION_CREATE, {
      topic,
      webhookSubscription: {
        callbackUrl: uri,
        format: 'JSON',
      },
    })

    const userErrors = data.webhookSubscriptionCreate.userErrors
    if (userErrors.length) {
      throw new RuntimeError(
        `Failed to create Shopify webhook subscription for ${topic}: ${userErrors.map((e) => e.message).join(', ')}`
      )
    }

    return data.webhookSubscriptionCreate.webhookSubscription?.id ?? null
  }

  public async unsubscribeWebhook(webhookId: string): Promise<void> {
    const data = await this.query<WebhookSubscriptionDeleteResponse>(WEBHOOK_SUBSCRIPTION_DELETE, {
      id: webhookId,
    })

    const userErrors = data.webhookSubscriptionDelete.userErrors
    if (userErrors.length) {
      throw new RuntimeError(
        `Failed to delete Shopify webhook subscription ${webhookId}: ${userErrors.map((e) => e.message).join(', ')}`
      )
    }
  }
}

/**
 * Exchanges a Shopify OAuth authorization code for a permanent (offline) access token.
 *
 * See https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/authorization-code-grant
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
    }),
  })

  if (!response.ok) {
    throw new RuntimeError(
      `Failed to exchange authorization code for access token: ${response.status} ${response.statusText}`
    )
  }

  const json = (await response.json()) as { access_token?: string; scope?: string }

  if (!json.access_token) {
    throw new RuntimeError('Shopify did not return an access_token in the token exchange response')
  }

  return json.access_token
}
