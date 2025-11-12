import * as lin from '@linear/sdk'
import * as genenv from '../../.genenv'
import * as utils from '.'
import { Issue, GRAPHQL_QUERIES, QUERY_INPUT, QUERY_RESPONSE } from './graphql-queries'

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

export class LinearApi {
  private constructor(
    private _client: lin.LinearClient,
    private _viewer: lin.User,
    private _teams: lin.Team[],
    private _states: lin.WorkflowState[]
  ) {}

  public static async create(): Promise<LinearApi> {
    const client = new lin.LinearClient({ apiKey: genenv.BUGBUSTER_LINEAR_API_KEY })
    const me = await client.viewer
    if (!me) {
      throw new Error('Viewer not found. Please ensure you are authenticated.')
    }

    const states = await this._listAllStates(client)
    const teams = await this._listAllTeams(client)

    return new LinearApi(client, me, teams, states)
  }

  public get client(): lin.LinearClient {
    return this._client
  }

  public get me(): lin.User {
    return this._viewer
  }

  public isTeam(teamKey: string): teamKey is TeamKey {
    return TEAM_KEYS.includes(teamKey as TeamKey)
  }

  public async findIssue(filter: { teamKey: TeamKey; issueNumber: number }): Promise<Issue | undefined> {
    const { teamKey, issueNumber } = filter
    const teamExists = this._teams.some((team) => team.key === teamKey)
    if (!teamExists) {
      return undefined
    }

    const data = await this._executeGraphqlQuery('findIssue', {
      filter: {
        number: { eq: issueNumber },
        team: { key: { eq: teamKey } },
      },
    })

    const [issue] = data.issues.nodes
    if (!issue) {
      return undefined
    }
    return issue
  }

  public issueStatus(issue: Issue): StateKey {
    const state = this._states.find((s) => s.id === issue.state.id)
    if (!state) {
      throw new Error(`State with ID "${issue.state.id}" not found.`)
    }
    return utils.string.toScreamingSnakeCase(state.name) as StateKey
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
            const state = this._states.find(
              (s) => utils.string.toScreamingSnakeCase(s.name) === stateKey && s.teamId === teamId
            )

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

  private async _executeGraphqlQuery<K extends keyof GRAPHQL_QUERIES>(
    queryName: K,
    variables: GRAPHQL_QUERIES[K][QUERY_INPUT]
  ): Promise<GRAPHQL_QUERIES[K][QUERY_RESPONSE]> {
    return (await this._client.client.rawRequest(GRAPHQL_QUERIES[queryName].query, variables))
      .data as GRAPHQL_QUERIES[K][QUERY_RESPONSE]
  }
}
