import * as types from 'src/types'

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
    name: string
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
    name: string
    completedAt: string | null
  } | null
  comments: {
    nodes: {
      id: string
      resolvedAt: string | null
      createdAt: string
      user: {
        id: string
      } | null
      parentId: string | null
    }[]
  }
}

export type TeamStates = {
  id: string
  states: {
    nodes: {
      id: string
      name: string
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
      query FindIssue($filter: IssueFilter, $first: Int, $after: String, $orderBy: PaginationOrderBy) {
        issues(filter: $filter, first: $first, after: $after, orderBy: $orderBy) {
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
              name
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
                parentId,
                resolvedAt,
                createdAt
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }`,
    [QUERY_INPUT]: {} as {
      filter: {
        team?: { key: { in: string[] } }
        number?: { eq: number }
        state?: {
          id: {
            nin?: string[]
            in?: string[]
          }
        }
        updatedAt?: {
          lt: types.ISO8601Duration
        }
      }
      after?: string
      first?: number
      orderBy?: 'createdAt' | 'updatedAt'
    },
    [QUERY_RESPONSE]: {} as {
      issues: {
        nodes: Issue[]
        pageInfo: Pagination
      }
    },
  },
  listStates: {
    query: `
      query ListStates($first: Int, $after: String) {
        workflowStates(first: $first, after: $after) {
          nodes {
            id
            name
            type
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }`,
    [QUERY_INPUT]: {} as {
      first?: number
      after?: string
    },
    [QUERY_RESPONSE]: {} as {
      workflowStates: {
        nodes: types.LinearState[]
        pageInfo: Pagination
      }
    },
  },
  findTeamStates: {
    query: `
      query GetAllTeams($filter: TeamFilter) {
        organization {
          teams(filter: $filter) {
            nodes {
              id
              key
              states {
                nodes {
                  id
                  name
                }
              }
            }
          }
        }
      }`,
    [QUERY_INPUT]: {} as {
      filter: {
        key?: { eq: string }
      }
    },
    [QUERY_RESPONSE]: {} as {
      organization: {
        teams: {
          nodes: {
            id: string
            states: {
              nodes: {
                id: string
                name: string
              }[]
            }
          }[]
        }
      }
    },
  },
} as const satisfies Record<string, GraphQLQuery<object, object>>

export type GRAPHQL_QUERIES = typeof GRAPHQL_QUERIES
export type QUERY_INPUT = typeof QUERY_INPUT
export type QUERY_RESPONSE = typeof QUERY_RESPONSE
