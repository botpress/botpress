const QUERY_INPUT = Symbol('graphqlInputType')
const QUERY_RESPONSE = Symbol('graphqlResponseType')

type GraphQLQuery<TInput, TResponse> = {
  query: string
  [QUERY_INPUT]: TInput
  [QUERY_RESPONSE]: TResponse
}

export const GRAPHQL_QUERIES = {
  createItem: {
    query: `
      mutation CreateNewItem($boardId: ID!, $itemName: String!) {
        create_item (board_id: $boardId, item_name: $itemName) {
          id
        }
      }`,
    [QUERY_INPUT]: {} as {
      boardId: string
      itemName: string
    },
    [QUERY_RESPONSE]: {} as {
      create_item: {
        id: string
      }
    },
  },
} as const satisfies Record<string, GraphQLQuery<object, object>>

export type GRAPHQL_QUERIES = typeof GRAPHQL_QUERIES
export type QUERY_INPUT = typeof QUERY_INPUT
export type QUERY_RESPONSE = typeof QUERY_RESPONSE
