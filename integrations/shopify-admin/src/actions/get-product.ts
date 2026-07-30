import { RuntimeError } from '@botpress/sdk'
import { ShopifyClient } from '../client'
import { PRODUCT_QUERY } from '../client/queries/admin'
import { transformProduct } from '../transformers'
import * as bp from '.botpress'

type ProductQueryResponse = {
  product: {
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
  } | null
}

export const getProduct: bp.IntegrationProps['actions']['getProduct'] = async ({ input, client, ctx }) => {
  const shopify = await ShopifyClient.create({ client, ctx })

  const data = await shopify.query<ProductQueryResponse>(PRODUCT_QUERY, { id: input.productId })

  if (!data.product) {
    throw new RuntimeError(`Product not found: ${input.productId}`)
  }

  return { product: transformProduct(data.product, shopify.shopDomain) }
}
