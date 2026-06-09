import { RuntimeError } from '@botpress/sdk'
import { STOREFRONT_GET_PRODUCT_BY_HANDLE, STOREFRONT_GET_PRODUCT_BY_ID } from '../client/queries/storefront'
import { StorefrontClient } from '../client/storefront'
import { transformStorefrontProduct } from '../transformers'
import * as bp from '.botpress'

type ProductResponse = {
  product: {
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
  } | null
}

export const getProduct: bp.IntegrationProps['actions']['getProduct'] = async ({ input, client, ctx }) => {
  if (!input.handle && !input.productId) {
    throw new RuntimeError('Either "handle" or "productId" must be provided.')
  }

  const storefront = await StorefrontClient.create({ client, ctx })

  const query = input.handle ? STOREFRONT_GET_PRODUCT_BY_HANDLE : STOREFRONT_GET_PRODUCT_BY_ID
  const variables = input.handle ? { handle: input.handle } : { id: input.productId }

  const data = await storefront.query<ProductResponse>(query, variables)

  if (!data.product) {
    throw new RuntimeError(`Product not found: ${input.handle ?? input.productId}`)
  }

  return { product: transformStorefrontProduct(data.product, storefront.shopDomain) }
}
