import { STOREFRONT_LIST_PRODUCTS } from '../client/queries/storefront'
import { StorefrontClient } from '../client/storefront'
import { transformStorefrontProduct } from '../transformers'
import * as bp from '.botpress'

type ProductsResponse = {
  products: {
    edges: Array<{
      node: {
        id: string
        title: string
        handle: string
        description: string | null
        productType: string | null
        vendor: string | null
        availableForSale: boolean
        onlineStoreUrl: string | null
        priceRange?: {
          minVariantPrice: { amount: string; currencyCode: string }
          maxVariantPrice: { amount: string; currencyCode: string }
        }
        variants: {
          edges: Array<{
            node: {
              id: string
              title: string
              availableForSale: boolean
              price: { amount: string; currencyCode: string }
            }
          }>
        }
        images: { edges: Array<{ node: { url: string; altText: string | null } }> }
      }
    }>
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
