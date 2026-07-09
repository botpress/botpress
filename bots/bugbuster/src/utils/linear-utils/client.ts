import * as types from '../../types'
import * as graphql from './graphql-queries'
import { Client } from '.botpress'

const RESULTS_PER_PAGE = 200

export class LinearApi {
  private _teams?: types.LinearTeam[] = undefined
  private _viewerId?: string = undefined

  private constructor(private _bpClient: Client) {}

  public static create(bpClient: Client): LinearApi {
    return new LinearApi(bpClient)
  }

  public async getViewerId(): Promise<string> {
    if (this._viewerId) {
      return this._viewerId
    }
    const { output: me } = await this._bpClient.callAction({
      type: 'linear:getUser',
      input: {},
    })
    if (!me) {
      throw new Error('Viewer not found. Please ensure you are authenticated.')
    }
    this._viewerId = me.linearId
    return this._viewerId
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
      state?: string
      typesToOmit?: types.StateType[]
      updatedBefore?: types.ISO8601Duration
    },
    nextPage?: string
  ): Promise<{ issues: graphql.Issue[]; pagination?: graphql.Pagination }> {
    const { teamKeys, issueNumber, state, typesToOmit, updatedBefore } = filter

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
          ...(state && {
            name: {
              containsIgnoreCase: state,
            },
          }),
          ...(typesToOmit && {
            type: {
              nin: typesToOmit,
            },
          }),
        },
        ...(updatedBefore && { updatedAt: { lt: updatedBefore } }),
      },
      ...(nextPage && { after: nextPage }),
      first: RESULTS_PER_PAGE,
    }

    const data = await this._executeGraphqlQuery('listIssues', queryInput)

    return { issues: data.issues.nodes, pagination: data.pageInfo }
  }

  public async resolveComments(issue: graphql.Issue): Promise<void> {
    const comments = issue.comments.nodes
    const me = await this.getViewerId()

    const promises: ReturnType<typeof this._bpClient.callAction<'linear:resolveComment'>>[] = []
    for (const comment of comments) {
      if (comment.user?.id === me && !comment.parentId && !comment.resolvedAt) {
        promises.push(this._bpClient.callAction({ type: 'linear:resolveComment', input: { id: comment.id } }))
      }
    }
    await Promise.all(promises)
  }

  public async createComment(props: { body: string; issueId: string; botId: string }): Promise<void> {
    const { body, issueId, botId } = props
    const conversation = await this._bpClient.callAction({
      type: 'linear:getOrCreateIssueConversation',
      input: {
        conversation: { id: issueId },
      },
    })

    await this._bpClient.createMessage({
      type: 'text',
      conversationId: conversation.output.conversationId,
      payload: { text: body },
      tags: {},
      userId: botId,
    })
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

  public async getTeams(): Promise<types.LinearTeam[]> {
    if (!this._teams) {
      this._teams = await this._listAllTeams()
    }
    return this._teams
  }

  private _listAllTeams = async (): Promise<types.LinearTeam[]> => {
    const response = await this._bpClient.callAction({ type: 'linear:listTeams', input: {} })
    return response.output.teams
  }

  private _listAllStates = async (): Promise<types.LinearState[]> => {
    let response = await this._bpClient.callAction<'linear:listStates'>({
      type: 'linear:listStates',
      input: { count: 100 },
    })
    let states: types.LinearState[] = response.output.states
    let startCursor = response.output.nextCursor

    while (startCursor) {
      response = await this._bpClient.callAction<'linear:listStates'>({
        type: 'linear:listStates',
        input: { count: 100, startCursor },
      })
      states = states.concat(response.output.states)
      startCursor = response.output.nextCursor
    }
    return states
  }

  private async _executeGraphqlQuery<K extends keyof graphql.GRAPHQL_QUERIES>(
    queryName: K,
    variables: graphql.GRAPHQL_QUERIES[K][graphql.QUERY_INPUT]
  ): Promise<graphql.GRAPHQL_QUERIES[K][graphql.QUERY_RESPONSE]> {
    const params = Object.entries(variables).map(([name, value]) => ({
      name,
      value,
    }))
    const result = await this._bpClient.callAction({
      type: 'linear:sendRawGraphqlQuery',
      input: {
        query: graphql.GRAPHQL_QUERIES[queryName].query,
        parameters: params,
      },
    })
    return result.output.result as graphql.GRAPHQL_QUERIES[K][graphql.QUERY_RESPONSE]
  }
}
