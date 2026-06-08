import { STOREFRONT_LIST_COLLECTIONS } from '../client/queries/storefront'
import { StorefrontClient } from '../client/storefront'
import { transformCollection } from '../transformers'
import * as bp from '.botpress'

type CollectionsResponse = {
  collections: {
    edges: Array<{
      node: {
        id: string
        title: string
        handle: string
        description: string | null
        image: { url: string; altText: string | null } | null
      }
    }>
    pageInfo: {
      hasNextPage: boolean
      endCursor: string | null
    }
  }
}

export const listCollections: bp.IntegrationProps['actions']['listCollections'] = async ({ input, client, ctx }) => {
  const storefront = await StorefrontClient.create({ client, ctx })

  const data = await storefront.query<CollectionsResponse>(STOREFRONT_LIST_COLLECTIONS, {
    first: input.first ?? 50,
    after: input.after,
  })

  return {
    collections: data.collections.edges.map(({ node }) => transformCollection(node)),
    pageInfo: {
      hasNextPage: data.collections.pageInfo.hasNextPage,
      endCursor: data.collections.pageInfo.endCursor ?? undefined,
    },
  }
}
