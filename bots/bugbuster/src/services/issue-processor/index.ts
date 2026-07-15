import * as sdk from '@botpress/sdk'
import * as types from '../../types'
import * as lin from '../../utils/linear-utils'
import * as cmts from '../comment-service'
import * as sts from '../state-service'
import * as tm from '../teams-manager'
import { lintIssue } from './lint-issue'

const IGNORED_STATES: types.CommonStateName[] = ['TRIAGE', 'BACKLOG', 'DONE', 'CANCELED', 'STALE', 'DUPLICATE']
const LINTIGNORE_LABEL_NAME = 'lintignore'
const LINTDETECTED_LABEL_NAME = 'lintdetected'

export class IssueProcessor {
  public constructor(
    private _logger: sdk.BotLogger,
    private _linear: lin.LinearApi,
    private _commentService: cmts.CommentService,
    private _stateService: sts.StateService,
    private _teamsManager: tm.TeamsManager
  ) {}

  /**
   * @returns The corresponding issue, or `undefined` if the issue is not found or not valid.
   */
  public async findIssue(issueNumber: number, teamKey: string | undefined): Promise<lin.Issue | undefined> {
    if (!issueNumber || !teamKey) {
      this._logger.error('Missing issueNumber or teamKey in event payload')
      return
    }

    const watchedTeams = await this._teamsManager.listWatchedTeams()
    if (!(await this._linear.isTeam(teamKey)) || !watchedTeams.includes(teamKey)) {
      this._logger.info(`Ignoring issue of team "${teamKey}"`)
      return
    }

    const issue = await this._linear.findIssue({ teamKey, issueNumber })
    if (!issue) {
      this._logger.warn(`Issue with number ${issueNumber} not found in team ${teamKey}`)
      return
    }

    return issue
  }

  public async listRelevantIssues(endCursor?: string): Promise<{ issues: lin.Issue[]; pagination?: lin.Pagination }> {
    const watchedTeams = await this._teamsManager.listWatchedTeams()
    if (watchedTeams.length === 0) {
      throw new Error('You have no watched teams.')
    }

    const stateIdsToOmit = await this._stateService.mapToStateIds(IGNORED_STATES)

    return await this._linear.listIssues(
      {
        teamKeys: watchedTeams,
        stateIdsToOmit,
      },
      endCursor
    )
  }

  public async lintIssue(
    issue: lin.Issue,
    isRecentlyLinted?: boolean,
    options?: { comment?: boolean }
  ): Promise<types.LintResult> {
    const shouldComment = options?.comment ?? true
    const state = await this._stateService.getIssueCommonStateName(issue)
    if (!state) {
      this._logger.warn(
        `Issue ${issue.identifier} has an unknown state ${issue.state.name}. Ignoring linting for this issue.`
      )
      return { identifier: issue.identifier, result: 'ignored' }
    }

    if (IGNORED_STATES.includes(state) || issue.labels.nodes.some((label) => label.name === LINTIGNORE_LABEL_NAME)) {
      return { identifier: issue.identifier, result: 'ignored' }
    }

    const errors = lintIssue(issue, state)

    if (errors.length === 0) {
      this._logger.info(`Issue ${issue.identifier} passed all lint checks.`)
      await this._commentService.resolveComments({ issue, type: 'lint' })
      await this._linear.removeLabel(issue, LINTDETECTED_LABEL_NAME).catch((thrown) => {
        const errMsg = thrown instanceof Error ? thrown.message : String(thrown)
        this._logger.error(
          `Failed to remove label ${LINTDETECTED_LABEL_NAME} from issue ${issue.identifier}: ${errMsg}`
        )
      })
      return { identifier: issue.identifier, result: 'succeeded' }
    }

    const warningMessage = `Issue ${issue.identifier} has ${errors.length} lint errors.`
    if (isRecentlyLinted) {
      this._logger.warn(`${warningMessage} Not commenting the issue because it has been linted recently.`)
      return { identifier: issue.identifier, result: 'succeeded' }
    }

    this._logger.warn(warningMessage)

    if (shouldComment) {
      await this._commentService.upsertComment({
        issue,
        type: 'lint',
        body: [
          `BugBuster Bot found the following problems with ${issue.identifier}:`,
          '',
          ...errors.map((error) => `- ${error.message}`),
        ].join('\n'),
      })
      await this._linear.addLabel(issue, LINTDETECTED_LABEL_NAME).catch((thrown) => {
        const errMsg = thrown instanceof Error ? thrown.message : String(thrown)
        this._logger.error(`Failed to add label ${LINTDETECTED_LABEL_NAME} to issue ${issue.identifier}: ${errMsg}`)
      })
    }

    return { identifier: issue.identifier, messages: errors.map((error) => error.message), result: 'failed' }
  }
}
