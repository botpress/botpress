const QUERY_INPUT = Symbol('graphqlInputType')
const QUERY_RESPONSE = Symbol('graphqlResponseType')

type GraphQLQuery<TInput, TResponse> = {
  query: string
  [QUERY_INPUT]: TInput
  [QUERY_RESPONSE]: TResponse
}

export type Issue = {
  id: string
  identifier: string
  title: string
  estimate: number | null
  priority: number
  assignee: {
    id: string
  } | null
  state: {
    id: string
  }
  labels: {
    nodes: {
      name: string
      parent: {
        name: string
      } | null
    }[]
  }
  inverseRelations: {
    nodes: {
      type: string
    }[]
  }
  project: {
    id: string
    name: string | null
    completedAt: string | null
  } | null
  comments: {
    nodes: {
      id: string
      resolvedAt: string | null
      user: {
        id: string
      }
      parentId: string | null
    }[]
  }
}

export type Pagination = {
  hasNextPage: boolean
  endCursor: string
}

export const GRAPHQL_QUERIES = {
  listIssues: {
    query: `
      query FindIssue($filter: IssueFilter, $first: Int, $after: String) {
        issues(filter: $filter, first: $first, after: $after) {
          nodes {
            id,
            identifier,
            title,
            estimate,
            priority,
            assignee {
              id
            },
            state {
              id
            },
            labels {
              nodes {
                name
                parent {
                  name
                }
              }
            },
            inverseRelations {
              nodes {
                type
              }
            },
            project {
              id,
              name,
              completedAt
            }
            comments {
              nodes {
                id,
                user {
                  id
                },
                parentId
              }
            }
          }
        }
      }`,
    [QUERY_INPUT]: {} as {
      filter: {
        team?: { key: { in: string[] } }
        number?: { eq: number }
        state?: {
          name: {
            nin: string[]
          }
        }
      }
      after?: string
      first?: number
    },
    [QUERY_RESPONSE]: {} as {
      issues: {
        nodes: Issue[]
      }
      pageInfo: Pagination
    },
  },
} as const satisfies Record<string, GraphQLQuery<object, object>>

export type GRAPHQL_QUERIES = typeof GRAPHQL_QUERIES
export type QUERY_INPUT = typeof QUERY_INPUT
export type QUERY_RESPONSE = typeof QUERY_RESPONSE
