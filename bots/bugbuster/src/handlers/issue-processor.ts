import { BotLogger } from '@botpress/sdk'
import { Issue, Pagination } from 'src/utils/graphql-queries'
import { LinearApi, StateKey } from 'src/utils/linear-utils'
import * as linlint from '../linear-lint-issue'
import { listTeams } from './teams-manager'
import { Client, WorkflowHandlerProps } from '.botpress'

const IGNORED_STATUSES: StateKey[] = ['TRIAGE', 'PRODUCTION_DONE', 'CANCELED', 'STALE']
const LINTIGNORE_LABEL_NAME = 'lintignore'

export class IssueProcessor {
  public constructor(
    private _logger: BotLogger,
    private _linear: LinearApi,
    private _client: Client,
    private _botId: string
  ) {}

  /**
   * @returns The corresponding issue, or `undefined` if the issue is not found or not valid.
   */
  public async findIssue(
    issueNumber: number,
    teamKey: string | undefined,
    eventName: string
  ): Promise<Issue | undefined> {
    if (!issueNumber || !teamKey) {
      this._logger.error('Missing issueNumber or teamKey in event payload')
      return
    }

    this._logger.info(`Linear issue ${eventName} event received`, `${teamKey}-${issueNumber}`)

    const teams = await listTeams(this._client, this._botId)
    if (!this._linear.isTeam(teamKey) || !teams.result?.includes(teamKey)) {
      this._logger.error(`Ignoring issue of team "${teamKey}"`)
      return
    }

    const issue = await this._linear.findIssue({ teamKey, issueNumber })
    if (!issue) {
      this._logger.error(`Issue with number ${issueNumber} not found in team ${teamKey}`)
      return
    }
    return issue
  }

  public async listIssues(teams: string[], endCursor?: string): Promise<Issue[]> {
    const validatedTeams = teams.filter((value) => this._linear.isTeam(value))

    const issues: Issue[] = []
    let pagination: Pagination | undefined

    do {
      const { issues: newIssues, pagination: newPagination } = await this._linear.listIssues(
        {
          teamKeys: validatedTeams,
          statusesToOmit: IGNORED_STATUSES,
        },
        endCursor
      )

      issues.push(...newIssues)
      pagination = newPagination
      endCursor = pagination?.endCursor
    } while (pagination?.hasNextPage)

    return issues
  }

  public async runLint(issue: Issue) {
    const status = this._linear.issueStatus(issue)
    if (IGNORED_STATUSES.includes(status) || issue.labels.nodes.some((label) => label.name === LINTIGNORE_LABEL_NAME)) {
      return
    }

    const errors = await linlint.lintIssue(issue, status)

    if (errors.length === 0) {
      this._logger.info(`Issue ${issue.identifier} passed all lint checks.`)
      await this._linear.resolveComments(issue)
      return
    }

    this._logger.warn(`Issue ${issue.identifier} has ${errors.length} lint errors:`)

    await this._linear.client.createComment({
      issueId: issue.id,
      body: [
        `BugBuster Bot found the following problems with ${issue.identifier}:`,
        '',
        ...errors.map((error: any) => `- ${error.message}`),
      ].join('\n'),
    })
  }

  public async runLints(issues: Issue[], workflow: WorkflowHandlerProps['lintAll']['workflow']) {
    for (const issue of issues) {
      await this.runLint(issue)
      await workflow.acknowledgeStartOfProcessing()
      await this._client.setState({
        id: workflow.id,
        name: 'lastLintedId',
        type: 'workflow',
        payload: { id: issue.id },
      })
    }
  }
}
