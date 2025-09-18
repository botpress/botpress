import { RuntimeError } from '@botpress/sdk'

import { Issue, IssueLabel, LinearClient, Project, Team, User, WorkflowState } from '@linear/sdk'
import { getLinearClient } from '../misc/utils'
import * as bp from '.botpress'

const gql = (strings: TemplateStringsArray, ..._values: any[]) => strings.join('')

export type Variables = { after: string | undefined; first: number; filter: Record<string, any> }

export const Query = gql`
  query ListIssues($after: String, $first: Int, $filter: IssueFilter) {
    issues(after: $after, first: $first, filter: $filter, orderBy: updatedAt) {
      pageInfo {
        endCursor
        hasNextPage
      }

      nodes {
        id
        number
        identifier
        previousIdentifiers
        title
        description
        priority
        priorityLabel
        estimate
        url
        createdAt
        updatedAt
        canceledAt
        startedTriageAt
        triagedAt
        completedAt
        state {
          name
          type
        }
        labels {
          nodes {
            id
            name
            color
            description
          }
        }
        assignee {
          id
          name
          email
        }
        creator {
          id
          name
          email
        }
        team {
          id
          name
          key
        }
        project {
          id
          name
          url
        }
        parent {
          id
          identifier
          url
        }
      }
    }
  }
`

export type Response = {
  issues: {
    pageInfo: {
      endCursor: string | null
      hasNextPage: boolean
    }

    nodes: {
      id: Issue['id']
      number: Issue['number']
      identifier: Issue['identifier']
      previousIdentifiers: Issue['previousIdentifiers']
      title: Issue['title']
      description: Issue['description']
      priority: Issue['priority']
      priorityLabel: Issue['priorityLabel']
      estimate: Issue['estimate'] | null
      url: Issue['url']
      createdAt: string
      updatedAt: string

      canceledAt?: string
      startedTriageAt: string
      triagedAt?: string
      completedAt?: string

      state: Pick<WorkflowState, 'name' | 'type'>
      labels: { nodes: Pick<IssueLabel, 'name' | 'description'>[] }
      assignee: Pick<User, 'id' | 'name' | 'email'> | null
      creator: Pick<User, 'id' | 'name' | 'email'>
      team: Pick<Team, 'id' | 'name' | 'key'> | null
      project: Pick<Project, 'id' | 'name' | 'url'> | null
      parent: Pick<Issue, 'id' | 'identifier' | 'url'> | null
    }[]
  }
}

export const listIssuesWithFilters = async (
  linear: LinearClient,
  props: {
    first: number
    after?: string
    filter?: any
  }
) => {
  const response = await linear.client
    .rawRequest<Response, Variables>(Query, {
      after: props.after,
      first: props.first,
      filter: props.filter || {},
    })
    .then((res) => res.data?.issues)

  if (!response) {
    throw new RuntimeError("Couldn't fetch issues")
  }

  return {
    issues: response.nodes.map((issue) => ({
      id: issue.id,
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
      number: issue.number,
      identifier: issue.identifier,
      previousIdentifiers: issue.previousIdentifiers,
      title: issue.title,
      description: issue.description || null,
      priority: issue.priority,
      priorityLabel: issue.priorityLabel,
      estimate: issue.estimate || null,
      url: issue.url,
      status: issue.state.name,
      labels: issue.labels.nodes.map((x) => x.name),
      creator: issue.creator,
      project: issue.project,
      assignee: issue.assignee,
      canceledAt: issue.canceledAt || null,
      startedTriageAt: issue.startedTriageAt || null,
      triagedAt: issue.triagedAt || null,
      parent: issue.parent || null,
      completedAt: issue.completedAt || null,
      teamKey: issue.team?.key || null,
      teamName: issue.team?.name || null,
    })),
    nextCursor: response.pageInfo.hasNextPage ? response.pageInfo.endCursor || undefined : undefined,
  }
}

export const listIssues: bp.IntegrationProps['actions']['listIssues'] = async (args) =>
  listIssuesWithFilters(await getLinearClient(args, args.ctx.integrationId), {
    first: args.input.count || 10,
    after: args.input.startCursor || undefined,
    filter: {
      updatedAt: args.input.startDate ? { gt: new Date(args.input.startDate) } : undefined,
      team: args.input.teamId ? { id: { eq: args.input.teamId } } : undefined,
    },
  })
