import { ShopifyClient } from '../client'
import { PRODUCTS_QUERY } from '../client/queries/admin'
import { transformProduct } from '../transformers'
import * as bp from '.botpress'

type ProductsQueryResponse = {
  products: {
    edges: Array<{
      node: {
        id: string
        title: string
        handle: string
        status: string
        vendor: string | null
        productType: string | null
        descriptionHtml: string | null
        createdAt: string
        updatedAt: string
        onlineStoreUrl: string | null
        onlineStorePreviewUrl: string | null
        variants: {
          edges: Array<{
            node: {
              id: string
              title: string
              price: string
              sku: string | null
              inventoryQuantity: number | null
            }
          }>
        }
      }
    }>
    pageInfo: {
      hasNextPage: boolean
      endCursor: string | null
    }
  }
}

export const listProducts: bp.IntegrationProps['actions']['listProducts'] = async ({ input, client, ctx }) => {
  const shopify = await ShopifyClient.create({ client, ctx })

  const data = await shopify.query<ProductsQueryResponse>(PRODUCTS_QUERY, {
    first: input.first ?? 50,
    query: input.query,
    after: input.after,
  })

  const products = data.products.edges.map(({ node }) => transformProduct(node, shopify.shopDomain))

  return {
    products,
    pageInfo: {
      hasNextPage: data.products.pageInfo.hasNextPage,
      endCursor: data.products.pageInfo.endCursor ?? undefined,
    },
  }
}
