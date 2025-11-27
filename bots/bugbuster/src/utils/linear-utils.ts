import * as lin from '@linear/sdk'
import * as genenv from '../../.genenv'
import * as utils from '.'
import { Issue, GRAPHQL_QUERIES, QUERY_INPUT, QUERY_RESPONSE, Pagination } from './graphql-queries'

const TEAM_KEYS = ['SQD', 'FT', 'BE', 'ENG'] as const
export type TeamKey = (typeof TEAM_KEYS)[number]

const STATE_KEYS = [
  'IN_PROGRESS',
  'MERGED_STAGING',
  'PRODUCTION_DONE',
  'BACKLOG',
  'TODO',
  'TRIAGE',
  'CANCELED',
  'BLOCKED',
  'STALE',
] as const
export type StateKey = (typeof STATE_KEYS)[number]
type State = { state: lin.WorkflowState; key: StateKey }

const RESULTS_PER_PAGE = 200

export class LinearApi {
  private constructor(
    private _client: lin.LinearClient,
    private _viewer: lin.User,
    private _teams: lin.Team[],
    private _states: State[]
  ) {}

  public static async create(): Promise<LinearApi> {
    const client = new lin.LinearClient({ apiKey: genenv.BUGBUSTER_LINEAR_API_KEY })
    const me = await client.viewer
    if (!me) {
      throw new Error('Viewer not found. Please ensure you are authenticated.')
    }

    const states = await this._listAllStates(client)
    const teams = await this._listAllTeams(client)

    return new LinearApi(client, me, teams, this._toStateObjects(states))
  }

  public get client(): lin.LinearClient {
    return this._client
  }

  public get me(): lin.User {
    return this._viewer
  }

  public isTeam(teamKey: string) {
    return this._teams.some((team) => team.key === teamKey)
  }

  public async findIssue(filter: { teamKey: string; issueNumber: number }): Promise<Issue | undefined> {
    const { teamKey, issueNumber } = filter

    const { issues } = await this.listIssues({
      teamKeys: [teamKey],
      issueNumber,
    })

    const [issue] = issues
    if (!issue) {
      return undefined
    }
    return issue
  }

  public async listIssues(
    filter: {
      teamKeys: string[]
      issueNumber?: number
      statusesToOmit?: StateKey[]
    },
    nextPage?: string
  ): Promise<{ issues: Issue[]; pagination?: Pagination }> {
    const { teamKeys, issueNumber, statusesToOmit } = filter

    const teamsExist = teamKeys.every((key) => this._teams.some((team) => team.key === key))
    if (!teamsExist) {
      return { issues: [] }
    }

    const stateNamesToOmit = statusesToOmit?.map((key) => {
      const matchingStates = this._states.filter((state) => state.key === key)
      if (matchingStates[0]) {
        return matchingStates[0].state.name
      }
      return ''
    })

    const queryInput: GRAPHQL_QUERIES['listIssues'][QUERY_INPUT] = {
      filter: {
        team: { key: { in: teamKeys } },
        ...(issueNumber && { number: { eq: issueNumber } }),
        ...(stateNamesToOmit && { state: { name: { nin: stateNamesToOmit } } }),
      },
      ...(nextPage && { after: nextPage }),
      first: RESULTS_PER_PAGE,
    }

    const data = await this._executeGraphqlQuery('listIssues', queryInput)

    return { issues: data.issues.nodes, pagination: data.pageInfo }
  }

  public async findLabel(filter: { name: string; parentName?: string }): Promise<lin.IssueLabel | undefined> {
    const { name, parentName } = filter
    const { nodes: labels } = await this._client.issueLabels({
      filter: {
        name: { eq: name },
        parent: parentName ? { name: { eq: parentName } } : undefined,
      },
    })

    const [label] = labels
    return label || undefined
  }

  public issueStatus(issue: Issue): StateKey {
    const state = this._states.find((s) => s.state.id === issue.state.id)
    if (!state) {
      throw new Error(`State with ID "${issue.state.id}" not found.`)
    }
    return state.key
  }

  public async resolveComments(issue: Issue): Promise<void> {
    const comments = issue.comments.nodes

    const promises: Promise<lin.CommentPayload>[] = []
    for (const comment of comments) {
      if (comment.user.id === this.me.id && !comment.resolvedAt) {
        promises.push(this._client.commentResolve(comment.id))
      }
    }
    await Promise.all(promises)
  }

  public get teams(): Record<TeamKey, lin.Team> {
    return new Proxy({} as Record<TeamKey, lin.Team>, {
      get: (_, key: TeamKey) => {
        const team = this._teams.find((t) => t.key === key)
        if (!team) {
          throw new Error(`Team with key "${key}" not found.`)
        }
        return team
      },
    })
  }

  public get states(): Record<TeamKey, Record<StateKey, lin.WorkflowState>> {
    return new Proxy({} as Record<TeamKey, Record<StateKey, lin.WorkflowState>>, {
      get: (_, teamKey: TeamKey) => {
        const teamId = this.teams[teamKey].id
        if (!teamId) {
          throw new Error(`Team with key "${teamKey}" not found.`)
        }

        return new Proxy({} as Record<StateKey, lin.WorkflowState>, {
          get: (_, stateKey: StateKey) => {
            const state = this._states.find((s) => s.key === stateKey && s.state.teamId === teamId)

            if (!state) {
              throw new Error(`State with key "${stateKey}" not found.`)
            }
            return state
          },
        })
      },
    })
  }

  private static _listAllTeams = async (client: lin.LinearClient): Promise<lin.Team[]> => {
    let teams: lin.Team[] = []
    let cursor: string | undefined = undefined
    do {
      const response = await client.teams({ after: cursor, first: 100 })
      teams = teams.concat(response.nodes)
      cursor = response.pageInfo.endCursor
    } while (cursor)
    return teams
  }

  private static _listAllStates = async (client: lin.LinearClient): Promise<lin.WorkflowState[]> => {
    let states: lin.WorkflowState[] = []
    let cursor: string | undefined = undefined
    do {
      const response = await client.workflowStates({ after: cursor, first: 100 })
      states = states.concat(response.nodes)
      cursor = response.pageInfo.endCursor
    } while (cursor)
    return states
  }

  private static _toStateObjects(states: lin.WorkflowState[]): State[] {
    const stateObjects: State[] = []
    for (const state of states) {
      const key = utils.string.toScreamingSnakeCase(state.name) as StateKey
      stateObjects.push({ key, state })
    }
    return stateObjects
  }

  private async _executeGraphqlQuery<K extends keyof GRAPHQL_QUERIES>(
    queryName: K,
    variables: GRAPHQL_QUERIES[K][QUERY_INPUT]
  ): Promise<GRAPHQL_QUERIES[K][QUERY_RESPONSE]> {
    return (await this._client.client.rawRequest(GRAPHQL_QUERIES[queryName].query, variables))
      .data as GRAPHQL_QUERIES[K][QUERY_RESPONSE]
  }
}
