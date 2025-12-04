import * as lin from '@linear/sdk'
import * as utils from '..'
import * as genenv from '../../../.genenv'
import * as graphql from './graphql-queries'

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
  private _teams?: lin.Team[] = undefined
  private _states?: State[] = undefined
  private _viewer?: lin.User = undefined

  private constructor(private _client: lin.LinearClient) {}

  public static create(): LinearApi {
    const client = new lin.LinearClient({ apiKey: genenv.BUGBUSTER_LINEAR_API_KEY })

    return new LinearApi(client)
  }

  public get client(): lin.LinearClient {
    return this._client
  }

  public async getMe(): Promise<lin.User> {
    const me = await this._client.viewer
    if (!me) {
      throw new Error('Viewer not found. Please ensure you are authenticated.')
    }
    this._viewer = me
    return this._viewer
  }

  public async isTeam(teamKey: string) {
    return (await this.getTeams()).some((team) => team.key === teamKey)
  }

  public async findIssue(filter: { teamKey: string; issueNumber: number }): Promise<graphql.Issue | undefined> {
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
  ): Promise<{ issues: graphql.Issue[]; pagination?: graphql.Pagination }> {
    const { teamKeys, issueNumber, statusesToOmit } = filter

    const teams = await this.getTeams()
    const teamsExist = teamKeys.every((key) => teams.some((team) => team.key === key))
    if (!teamsExist) {
      return { issues: [] }
    }

    const states = await this.getStates()
    const stateNamesToOmit = statusesToOmit?.map((key) => {
      const matchingStates = states.filter((state) => state.key === key)
      if (matchingStates[0]) {
        return matchingStates[0].state.name
      }
      return ''
    })

    const queryInput: graphql.GRAPHQL_QUERIES['listIssues'][graphql.QUERY_INPUT] = {
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

  public async issueStatus(issue: graphql.Issue): Promise<StateKey> {
    const states = await this.getStates()
    const state = states.find((s) => s.state.id === issue.state.id)
    if (!state) {
      throw new Error(`State with ID "${issue.state.id}" not found.`)
    }
    return state.key
  }

  public async resolveComments(issue: graphql.Issue): Promise<void> {
    const comments = issue.comments.nodes
    const me = await this.getMe()

    const promises: Promise<lin.CommentPayload>[] = []
    for (const comment of comments) {
      if (comment.user.id === me.id && !comment.parentId && !comment.resolvedAt) {
        promises.push(this._client.commentResolve(comment.id))
      }
    }
    await Promise.all(promises)
  }

  public async getTeams(): Promise<lin.Team[]> {
    if (!this._teams) {
      this._teams = await LinearApi._listAllTeams(this._client)
    }
    return this._teams
  }

  public async getTeamRecords(): Promise<Record<TeamKey, lin.Team>> {
    if (!this._teams) {
      this._teams = await LinearApi._listAllTeams(this._client)
    }
    const safeTeams = this._teams

    return new Proxy({} as Record<TeamKey, lin.Team>, {
      get: async (_, key: TeamKey): Promise<lin.Team> => {
        const team = safeTeams.find((t) => t.key === key)
        if (!team) {
          throw new Error(`Team with key "${key}" not found.`)
        }
        return team
      },
    })
  }

  public async getStates(): Promise<State[]> {
    if (!this._states) {
      const states = await LinearApi._listAllStates(this._client)
      this._states = LinearApi._toStateObjects(states)
    }
    return this._states
  }

  public async getStateRecords(): Promise<Record<TeamKey, Record<StateKey, lin.WorkflowState>>> {
    if (!this._states) {
      const states = await LinearApi._listAllStates(this._client)
      this._states = LinearApi._toStateObjects(states)
    }
    const safeStates = this._states
    const teams = await this.getTeamRecords()

    return new Proxy({} as Record<TeamKey, Record<StateKey, lin.WorkflowState>>, {
      get: (_, teamKey: TeamKey) => {
        const teamId = teams[teamKey].id
        if (!teamId) {
          throw new Error(`Team with key "${teamKey}" not found.`)
        }

        return new Proxy({} as Record<StateKey, lin.WorkflowState>, {
          get: (_, stateKey: StateKey) => {
            const state = safeStates.find((s) => s.key === stateKey && s.state.teamId === teamId)

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

  private async _executeGraphqlQuery<K extends keyof graphql.GRAPHQL_QUERIES>(
    queryName: K,
    variables: graphql.GRAPHQL_QUERIES[K][graphql.QUERY_INPUT]
  ): Promise<graphql.GRAPHQL_QUERIES[K][graphql.QUERY_RESPONSE]> {
    return (await this._client.client.rawRequest(graphql.GRAPHQL_QUERIES[queryName].query, variables))
      .data as graphql.GRAPHQL_QUERIES[K][graphql.QUERY_RESPONSE]
  }
}
