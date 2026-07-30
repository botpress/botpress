import { RuntimeError } from '@botpress/sdk'
import { STOREFRONT_GET_COLLECTION_BY_HANDLE, STOREFRONT_GET_COLLECTION_BY_ID } from '../client/queries/storefront'
import { StorefrontClient } from '../client/storefront'
import { transformCollection, transformStorefrontProduct } from '../transformers'
import * as bp from '.botpress'

type CollectionResponse = {
  collection: {
    id: string
    title: string
    handle: string
    description: string | null
    image: { url: string; altText: string | null } | null
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
  } | null
}

export const getCollection: bp.IntegrationProps['actions']['getCollection'] = async ({ input, client, ctx }) => {
  if (!input.handle && !input.collectionId) {
    throw new RuntimeError('Either "handle" or "collectionId" must be provided.')
  }

  const storefront = await StorefrontClient.create({ client, ctx })

  const query = input.handle ? STOREFRONT_GET_COLLECTION_BY_HANDLE : STOREFRONT_GET_COLLECTION_BY_ID
  const variables = input.handle
    ? { handle: input.handle, productsFirst: input.productsFirst ?? 50 }
    : { id: input.collectionId, productsFirst: input.productsFirst ?? 50 }

  const data = await storefront.query<CollectionResponse>(query, variables)

  if (!data.collection) {
    throw new RuntimeError(`Collection not found: ${input.handle ?? input.collectionId}`)
  }

  return {
    collection: transformCollection(data.collection),
    products: data.collection.products.edges.map(({ node }) => transformStorefrontProduct(node, storefront.shopDomain)),
    pageInfo: {
      hasNextPage: data.collection.products.pageInfo.hasNextPage,
      endCursor: data.collection.products.pageInfo.endCursor ?? undefined,
    },
  }
}
