import * as graphql from './graphql-queries'
import * as types from './types'
import * as bp from '.botpress'

const ISSUES_PER_PAGE = 50
const STATES_PER_PAGE = 200

type CommentPredicate = (comment: types.IssueComment) => boolean

export class LinearApi {
  private _teams?: types.Team[] = undefined
  private _states?: types.State[] = undefined
  private _viewerId?: string = undefined
  private _labelIds: Record<string, string> = {}

  private constructor(private _bpClient: bp.Client) {}

  public static create(bpClient: bp.Client): LinearApi {
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

  public async findIssue(filter: { teamKey: string; issueNumber: number }): Promise<types.Issue | undefined> {
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
      stateIdsToOmit?: string[]
      stateIdsToInclude?: string[]
      updatedBefore?: types.ISO8601Duration
    },
    nextPage?: string
  ): Promise<{ issues: types.Issue[]; pagination?: types.Pagination }> {
    const { teamKeys, issueNumber, stateIdsToOmit, stateIdsToInclude, updatedBefore } = filter

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
          id: {
            ...(stateIdsToOmit && { nin: stateIdsToOmit }),
            ...(stateIdsToInclude && { in: stateIdsToInclude }),
          },
        },
        ...(updatedBefore && { updatedAt: { lt: updatedBefore } }),
      },
      ...(nextPage && { after: nextPage }),
      first: ISSUES_PER_PAGE,
      orderBy: 'createdAt',
    }

    const data = await this._executeGraphqlQuery('listIssues', queryInput)

    return { issues: data.issues.nodes, pagination: data.issues.pageInfo }
  }

  public async resolveComments(props: { issue: types.Issue; predicate?: CommentPredicate }): Promise<void> {
    const me = await this.getViewerId()
    const openComments = this._listOpenBotComments(props.issue, me, props.predicate)
    const openCommentIds = openComments.map((comment) => comment.id)
    await this._resolveCommentsByIds(openCommentIds)
  }

  public async upsertComment(props: {
    issue: types.Issue
    body: string
    botId: string
    predicate?: (comment: types.IssueComment) => boolean
  }): Promise<void> {
    const { issue, body, botId } = props

    const me = await this.getViewerId()
    const [existing] = this._listOpenBotComments(issue, me, props.predicate)

    if (!existing) {
      await this.createComment({ body, issueId: issue.id, botId })
      return
    }

    if (existing.body.trim() === body.trim()) {
      return
    }

    await this._executeGraphqlQuery('updateComment', { id: existing.id, input: { body } })
  }

  private _listOpenBotComments(
    issue: types.Issue,
    viewerId: string,
    predicate: CommentPredicate = () => true
  ): types.Issue['comments']['nodes'] {
    return issue.comments.nodes.filter(
      (comment) => comment.user?.id === viewerId && !comment.parentId && !comment.resolvedAt && predicate(comment)
    )
  }

  private async _resolveCommentsByIds(commentIds: string[]): Promise<void> {
    await Promise.all(
      commentIds.map((id) => this._bpClient.callAction({ type: 'linear:resolveComment', input: { id } }))
    )
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

  public async addLabel(issue: types.Issue, labelName: string): Promise<void> {
    if (issue.labels.nodes.some((label) => label.name === labelName)) {
      return
    }
    const labelId = await this._getLabelId(labelName)
    await this._executeGraphqlQuery('addLabelToIssue', { id: issue.id, labelId })
  }

  public async removeLabel(issue: types.Issue, labelName: string): Promise<void> {
    if (!issue.labels.nodes.some((label) => label.name === labelName)) {
      return
    }
    const labelId = await this._getLabelId(labelName)
    await this._executeGraphqlQuery('removeLabelFromIssue', { id: issue.id, labelId })
  }

  private async _getLabelId(labelName: string): Promise<string> {
    const cached = this._labelIds[labelName]
    if (cached) {
      return cached
    }

    const found = await this._executeGraphqlQuery('findLabel', {
      filter: { name: { eq: labelName }, team: { null: true } },
    })
    const label = found.issueLabels.nodes.find((node) => node.name === labelName)
    if (!label) {
      throw new Error(`Label "${labelName}" does not exist in the Linear workspace.`)
    }

    this._labelIds[labelName] = label.id
    return label.id
  }

  public async findTeamStates(teamKey: string): Promise<types.TeamStates | undefined> {
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

  public async getTeams(): Promise<types.Team[]> {
    if (!this._teams) {
      this._teams = await this._listAllTeams()
    }
    return this._teams
  }

  public async getStates(): Promise<types.State[]> {
    if (!this._states) {
      this._states = await this._listAllStates()
    }
    return this._states
  }

  private _listAllTeams = async (): Promise<types.Team[]> => {
    const response = await this._bpClient.callAction({ type: 'linear:listTeams', input: {} })
    return response.output.teams
  }

  private _listAllStates = async (): Promise<types.State[]> => {
    // We fetch states via GraphQL rather than the linear:listStates action because the action's
    // output does not include the state `type`, which we need to normalize states across teams.
    let states: types.State[] = []
    let after: string | undefined = undefined

    do {
      const queryInput: graphql.GRAPHQL_QUERIES['listStates'][graphql.QUERY_INPUT] = {
        first: STATES_PER_PAGE,
        ...(after && { after }),
      }
      const data = await this._executeGraphqlQuery('listStates', queryInput)
      states = states.concat(data.workflowStates.nodes)
      after = data.workflowStates.pageInfo.hasNextPage ? data.workflowStates.pageInfo.endCursor : undefined
    } while (after)

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
