import { STOREFRONT_LIST_PRODUCTS } from '../client/queries/storefront'
import { StorefrontClient } from '../client/storefront'
import { transformStorefrontProduct, StorefrontProductNode } from '../transformers'
import * as bp from '.botpress'

type ProductsResponse = {
  products: {
    edges: Array<{ node: StorefrontProductNode }>
    pageInfo: {
      hasNextPage: boolean
      endCursor: string | null
    }
  }
}

export const listProducts: bp.IntegrationProps['actions']['listProducts'] = async ({ input, client, ctx }) => {
  const storefront = await StorefrontClient.create({ client, ctx })

  const data = await storefront.query<ProductsResponse>(STOREFRONT_LIST_PRODUCTS, {
    query: input.query,
    first: input.first ?? 50,
    after: input.after,
  })

  return {
    products: data.products.edges.map(({ node }) => transformStorefrontProduct(node, storefront.shopDomain)),
    pageInfo: {
      hasNextPage: data.products.pageInfo.hasNextPage,
      endCursor: data.products.pageInfo.endCursor ?? undefined,
    },
  }
}
