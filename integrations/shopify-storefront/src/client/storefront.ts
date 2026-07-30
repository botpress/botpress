import { RuntimeError } from '@botpress/sdk'
import { SHOPIFY_API_VERSION } from './queries/common'
import * as bp from '.botpress'

type StorefrontClientProps = {
  shopDomain: string
  storefrontAccessToken: string
}

type CreateProps = {
  client: bp.Client
  ctx: bp.Context
}

export class StorefrontClient {
  public readonly shopDomain: string
  private readonly _storefrontAccessToken: string

  public constructor({ shopDomain, storefrontAccessToken }: StorefrontClientProps) {
    this.shopDomain = shopDomain
    this._storefrontAccessToken = storefrontAccessToken
  }

  public static async create({ client, ctx }: CreateProps): Promise<StorefrontClient> {
    const { state } = await client.getState({ type: 'integration', name: 'credentials', id: ctx.integrationId })

    if (!state.payload.shopDomain) {
      throw new RuntimeError('Shopify credentials not found. Please complete the OAuth flow first.')
    }

    if (!state.payload.storefrontAccessToken) {
      throw new RuntimeError(
        'Storefront access token not found. The integration may need to be re-installed to provision Storefront API access.'
      )
    }

    return new StorefrontClient({
      shopDomain: state.payload.shopDomain,
      storefrontAccessToken: state.payload.storefrontAccessToken,
    })
  }

  public async query<T = unknown>(graphql: string, variables: Record<string, unknown> = {}): Promise<T> {
    const url = `https://${this.shopDomain}.myshopify.com/api/${SHOPIFY_API_VERSION}/graphql.json`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': this._storefrontAccessToken,
      },
      body: JSON.stringify({ query: graphql, variables }),
    })

    if (!response.ok) {
      throw new RuntimeError(`Shopify Storefront API error: ${response.status} ${response.statusText}`)
    }

    const json = (await response.json()) as { data?: T; errors?: Array<{ message: string }> }

    if (json.errors?.length) {
      throw new RuntimeError(`Shopify Storefront GraphQL error: ${json.errors.map((e) => e.message).join(', ')}`)
    }

    return json.data as T
  }
}
