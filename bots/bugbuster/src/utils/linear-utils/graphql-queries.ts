import * as types from './types'

const QUERY_INPUT = Symbol('graphqlInputType')
const QUERY_RESPONSE = Symbol('graphqlResponseType')

type GraphQLQuery<TInput, TResponse> = {
  query: string
  [QUERY_INPUT]: TInput
  [QUERY_RESPONSE]: TResponse
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
                body,
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
        nodes: types.Issue[]
        pageInfo: types.Pagination
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
        nodes: types.State[]
        pageInfo: types.Pagination
      }
    },
  },
  findLabel: {
    query: `
      query FindLabel($filter: IssueLabelFilter) {
        issueLabels(filter: $filter) {
          nodes {
            id
            name
          }
        }
      }`,
    [QUERY_INPUT]: {} as {
      filter: {
        name: { eq: string }
        // The lintdetected label is a workspace-level label; scoping to team-less labels avoids
        // matching (and caching) a same-named label that belongs to a specific team.
        team: { null: boolean }
      }
    },
    [QUERY_RESPONSE]: {} as {
      issueLabels: {
        nodes: {
          id: string
          name: string
        }[]
      }
    },
  },
  addLabelToIssue: {
    query: `
      mutation AddLabel($id: String!, $labelId: String!) {
        issueAddLabel(id: $id, labelId: $labelId) {
          success
        }
      }`,
    [QUERY_INPUT]: {} as {
      id: string
      labelId: string
    },
    [QUERY_RESPONSE]: {} as {
      issueAddLabel: { success: boolean }
    },
  },
  removeLabelFromIssue: {
    query: `
      mutation RemoveLabel($id: String!, $labelId: String!) {
        issueRemoveLabel(id: $id, labelId: $labelId) {
          success
        }
      }`,
    [QUERY_INPUT]: {} as {
      id: string
      labelId: string
    },
    [QUERY_RESPONSE]: {} as {
      issueRemoveLabel: { success: boolean }
    },
  },
  updateComment: {
    query: `
      mutation UpdateComment($id: String!, $input: CommentUpdateInput!) {
        commentUpdate(id: $id, input: $input) {
          success
        }
      }`,
    [QUERY_INPUT]: {} as {
      id: string
      input: { body: string }
    },
    [QUERY_RESPONSE]: {} as {
      commentUpdate: { success: boolean }
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
