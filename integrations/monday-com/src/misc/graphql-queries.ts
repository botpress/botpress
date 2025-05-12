const QUERY_INPUT = Symbol('graphqlInputType')
const QUERY_RESPONSE = Symbol('graphqlResponseType')

type GraphQLQuery<TInput, TResponse> = {
  query: string
  [QUERY_INPUT]: TInput
  [QUERY_RESPONSE]: TResponse
}

export const GRAPHQL_QUERIES = {
  createWebhook: {
    query: `
      mutation CreateWebhook($boardId: ID!, $webhookUrl: String!, $event: WebhookEventType!) {
        create_webhook (board_id: $boardId, url: $webhookUrl, event: $event) {
          id
          board_id
        }
      }`,
    [QUERY_INPUT]: {} as {
      boardId: string
      webhookUrl: string
      event: 'create_item'
    },
    [QUERY_RESPONSE]: {} as {
      create_webhook: {
        id: string
        boardId: string
      }
    },
  },

  deleteWebhook: {
    query: `
      mutation($webhookId: ID!) {
        delete_webhook (id: $webhookId) { id }
      }`,
    [QUERY_INPUT]: {} as {
      webhookId: string
    },
    [QUERY_RESPONSE]: {} as {
      delete_webhook: {
        id: string
      }
    },
  },

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
