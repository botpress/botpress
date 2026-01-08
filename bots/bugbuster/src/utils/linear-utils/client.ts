import * as lin from '@linear/sdk'
import * as utils from '..'
import * as genenv from '../../../.genenv'
import * as types from '../../types'
import * as graphql from './graphql-queries'

type State = { state: lin.WorkflowState; key: types.StateKey }

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
    if (this._viewer) {
      return this._viewer
    }
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
      statesToOmit?: types.StateKey[]
      statesToInclude?: types.StateKey[]
      updatedBefore?: types.ISO8601Duration
    },
    nextPage?: string
  ): Promise<{ issues: graphql.Issue[]; pagination?: graphql.Pagination }> {
    const { teamKeys, issueNumber, statesToOmit, statesToInclude, updatedBefore } = filter

    const teams = await this.getTeams()
    const teamsExist = teamKeys.every((key) => teams.some((team) => team.key === key))
    if (!teamsExist) {
      return { issues: [] }
    }

    const queryInput: graphql.GRAPHQL_QUERIES['listIssues'][graphql.QUERY_INPUT] = {
      filter: {
        team: { key: { in: teamKeys } },
        ...(issueNumber && { number: { eq: issueNumber } }),
        state: {
          name: {
            ...(statesToOmit && { nin: await this._stateKeysToStates(statesToOmit) }),
            ...(statesToInclude && { in: await this._stateKeysToStates(statesToInclude) }),
          },
        },
        ...(updatedBefore && { updatedAt: { lt: updatedBefore } }),
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

  public async issueState(issue: graphql.Issue): Promise<types.StateKey> {
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
      if (comment.user?.id === me.id && !comment.parentId && !comment.resolvedAt) {
        promises.push(this._client.commentResolve(comment.id))
      }
    }
    await Promise.all(promises)
  }

  public async findTeamStates(teamKey: string): Promise<graphql.TeamStates | undefined> {
    const queryInput: graphql.GRAPHQL_QUERIES['findTeamStates'][graphql.QUERY_INPUT] = {
      filter: { key: { eq: teamKey } },
    }

    const data = await this._executeGraphqlQuery('findTeamStates', queryInput)

    const [team] = data.organization.teams.nodes
    if (!team) {
      return undefined
    }
    return team
  }

  public async getTeams(): Promise<lin.Team[]> {
    if (!this._teams) {
      this._teams = await this._listAllTeams()
    }
    return this._teams
  }

  public async getStates(): Promise<State[]> {
    if (!this._states) {
      const states = await this._listAllStates()
      this._states = LinearApi._toStateObjects(states)
    }
    return this._states
  }

  private async _stateKeysToStates(keys: types.StateKey[]) {
    const states = await this.getStates()
    return keys?.map((key) => {
      const matchingStates = states.filter((state) => state.key === key)
      if (matchingStates[0]) {
        return matchingStates[0].state.name
      }
      return ''
    })
  }

  private _listAllTeams = async (): Promise<lin.Team[]> => {
    let teams: lin.Team[] = []
    let cursor: string | undefined = undefined
    do {
      const response = await this._client.teams({ after: cursor, first: 100 })
      teams = teams.concat(response.nodes)
      cursor = response.pageInfo.endCursor
    } while (cursor)
    return teams
  }

  private _listAllStates = async (): Promise<lin.WorkflowState[]> => {
    let states: lin.WorkflowState[] = []
    let cursor: string | undefined = undefined
    do {
      const response = await this._client.workflowStates({ after: cursor, first: 100 })
      states = states.concat(response.nodes)
      cursor = response.pageInfo.endCursor
    } while (cursor)
    return states
  }

  private static _toStateObjects(states: lin.WorkflowState[]): State[] {
    const stateObjects: State[] = []
    for (const state of states) {
      const key = utils.string.toScreamingSnakeCase(state.name) as types.StateKey
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
