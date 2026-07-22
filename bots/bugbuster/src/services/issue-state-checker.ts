import * as sdk from '@botpress/sdk'
import * as types from '../types'
import * as lin from '../utils/linear-utils'
import * as cmts from './comment-service'
import * as sts from './state-service'

export class IssueStateChecker {
  public constructor(
    private _linear: lin.LinearApi,
    private _commentService: cmts.CommentService,
    private _stateService: sts.StateService,
    private _logger: sdk.BotLogger
  ) {}

  public async processIssues(props: { stateAttributes: types.StateAttributes; teams: string[] }) {
    const { stateAttributes, teams } = props

    const allStates = await this._stateService.getStates()
    const stateIdsToInclude = allStates.filter(stateAttributes.filter).map((state) => state.id)

    let hasNextPage = false
    let endCursor: string | undefined = undefined
    do {
      const { issues, pagination } = await this._linear.listIssues(
        {
          teamKeys: teams,
          stateIdsToInclude,
          updatedBefore: stateAttributes.maxTimeSinceLastUpdate,
        },
        endCursor
      )

      for (const issue of issues) {
        await this._commentService.upsertComment({
          issue,
          type: 'stale',
          body: stateAttributes.warningComment,
        })
        this._logger.warn(stateAttributes.buildWarningReason(issue.identifier))
      }

      hasNextPage = pagination?.hasNextPage ?? false
      endCursor = pagination?.endCursor
    } while (hasNextPage)
  }
}
