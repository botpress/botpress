const QUERY_INPUT = Symbol('graphqlInputType')
const QUERY_RESPONSE = Symbol('graphqlResponseType')

type GraphQLQuery<TInput, TResponse> = {
  query: string
  [QUERY_INPUT]: TInput
  [QUERY_RESPONSE]: TResponse
}

export const GRAPHQL_QUERIES = {
  addDiscussionComment: {
    query: `
      mutation AddDiscussionComment($discussionNodeId: ID!, $body: String!) {
        addDiscussionComment(input: {discussionId: $discussionNodeId, body: $body}) {
          comment {
            id
            databaseId
            url
          }
        }
      }`,
    [QUERY_INPUT]: {} as {
      discussionNodeId: string
      body: string
    },
    [QUERY_RESPONSE]: {} as {
      addDiscussionComment: {
        comment: {
          id: string
          databaseId: number
          url: string
        }
      }
    },
  },

  addDiscussionCommentReply: {
    query: `
      mutation AddDiscussionComment($discussionNodeId: ID!, $body: String!, replyToCommentNodeId: ID!) {
        addDiscussionComment(input: {discussionId: $discussionNodeId, body: $body, replyToId: $replyToCommentNodeId}) {
          comment {
            id
            databaseId
            url
          }
        }
      }`,
    [QUERY_INPUT]: {} as {
      discussionNodeId: string
      replyToCommentNodeId: string
      body: string
    },
    [QUERY_RESPONSE]: {} as {
      addDiscussionComment: {
        comment: {
          id: string
          databaseId: number
          url: string
        }
      }
    },
  },
} as const satisfies Record<string, GraphQLQuery<object, object>>

export type GRAPHQL_QUERIES = typeof GRAPHQL_QUERIES
export type QUERY_INPUT = typeof QUERY_INPUT
export type QUERY_RESPONSE = typeof QUERY_RESPONSE
