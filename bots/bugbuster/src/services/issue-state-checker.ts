import * as sdk from '@botpress/sdk'
import * as types from '../types'
import * as lin from '../utils/linear-utils'

export class IssueStateChecker {
  public constructor(
    private _linear: lin.LinearApi,
    private _logger: sdk.BotLogger
  ) {}

  public async processIssues(props: { stateAttributes: types.StateAttributes; teams: string[] }) {
    const { stateAttributes, teams } = props

    let hasNextPage = false
    let endCursor: string | undefined = undefined
    do {
      const { issues, pagination } = await this._linear.listIssues(
        {
          teamKeys: teams,
          statesToInclude: [stateAttributes.stateKey],
          updatedBefore: stateAttributes.maxTimeSinceLastUpdate,
        },
        endCursor
      )

      for (const issue of issues) {
        await this._linear.client.createComment({
          issueId: issue.id,
          body: stateAttributes.warningComment,
        })
        this._logger.warn(stateAttributes.buildWarningReason(issue.identifier))
      }

      hasNextPage = pagination?.hasNextPage ?? false
      endCursor = pagination?.endCursor
    } while (hasNextPage)
  }
}
