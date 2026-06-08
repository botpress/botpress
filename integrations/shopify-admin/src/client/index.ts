import { RuntimeError } from '@botpress/sdk'
import { getOrRefreshCredentials } from '../auth'
import { WEBHOOK_SUBSCRIPTION_CREATE, WEBHOOK_SUBSCRIPTION_DELETE } from './queries/admin'
import { SHOPIFY_API_VERSION } from './queries/common'
import * as bp from '.botpress'

type ShopifyClientProps = {
  shopDomain: string
  accessToken: string
  client?: bp.Client
  ctx?: bp.Context
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
  private _accessToken: string
  private readonly _client?: bp.Client
  private readonly _ctx?: bp.Context

  public constructor({ shopDomain, accessToken, client, ctx }: ShopifyClientProps) {
    this.shopDomain = shopDomain
    this._accessToken = accessToken
    this._client = client
    this._ctx = ctx
  }

  public static async create({ client, ctx }: CreateProps): Promise<ShopifyClient> {
    const { shopDomain, accessToken } = await getOrRefreshCredentials({ client, ctx })
    return new ShopifyClient({ shopDomain, accessToken, client, ctx })
  }

  public async query<T = unknown>(graphql: string, variables: Record<string, unknown> = {}): Promise<T> {
    return this._queryWithRetry(graphql, variables, false)
  }

  private async _queryWithRetry<T>(graphql: string, variables: Record<string, unknown>, retried: boolean): Promise<T> {
    const url = `https://${this.shopDomain}.myshopify.com/admin/api/${SHOPIFY_API_VERSION}/graphql.json`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': this._accessToken,
      },
      body: JSON.stringify({ query: graphql, variables }),
    })

    if (response.status === 401 && !retried && this._client && this._ctx) {
      const { accessToken } = await getOrRefreshCredentials({ client: this._client, ctx: this._ctx, force: true })
      this._accessToken = accessToken
      return this._queryWithRetry(graphql, variables, true)
    }

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

  public async subscribeWebhook(topic: string, uri: string): Promise<string | null> {
    const data = await this.query<WebhookSubscriptionCreateResponse>(WEBHOOK_SUBSCRIPTION_CREATE, {
      topic,
      webhookSubscription: {
        uri,
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
