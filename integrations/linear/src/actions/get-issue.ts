import { RuntimeError } from '@botpress/sdk'

import { Issue, IssueLabel, LinearClient, Project, Team, User, WorkflowState } from '@linear/sdk'
import { getLinearClient } from '../misc/utils'
import * as bp from '.botpress'

const gql = (strings: TemplateStringsArray, ..._values: any[]) => strings.join('')

export type Variables = { issueId: string }

export const Query = gql`
  query GetIssue($issueId: String!) {
    issue(id: $issueId) {
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
`

export type Response = {
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
}

export const getIssueFromId = async (linear: LinearClient, issueId: string) => {
  const response = await linear.client
    .rawRequest<{ issue: Response }, Variables>(Query, {
      issueId,
    })
    .then((res) => res.data?.issue)

  if (!response) {
    throw new RuntimeError(`Issue with ID "${issueId}" not found`)
  }

  return {
    id: response.id,
    createdAt: response.createdAt,
    updatedAt: response.updatedAt,
    number: response.number,
    identifier: response.identifier,
    previousIdentifiers: response.previousIdentifiers,
    title: response.title,
    description: response.description || null,
    priority: response.priority,
    priorityLabel: response.priorityLabel,
    estimate: response.estimate || null,
    url: response.url,
    status: response.state.name,
    labels: response.labels.nodes.map((x) => x.name),
    creator: response.creator,
    project: response.project,
    assignee: response.assignee,
    canceledAt: response.canceledAt || null,
    startedTriageAt: response.startedTriageAt || null,
    triagedAt: response.triagedAt || null,
    parent: response.parent || null,
    completedAt: response.completedAt || null,
    teamKey: response.team?.key || null,
    teamName: response.team?.name || null,
  }
}

export const getIssue: bp.IntegrationProps['actions']['getIssue'] = async (args) =>
  getIssueFromId(await getLinearClient(args, args.ctx.integrationId), args.input.issueId)
