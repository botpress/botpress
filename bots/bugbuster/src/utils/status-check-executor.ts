import { BotLogger } from '@botpress/sdk'
import { WatchedIssue } from 'src/types'
import { Issue } from './graphql-queries'
import { LinearApi, StateKey } from './linear-utils'

export class StatusCheckExecutor {
  public constructor(
    private _issues: Issue[],
    private _logger: BotLogger,
    private _linear: LinearApi
  ) {}

  public executeStatusCheck = async (
    outdatedIssues: WatchedIssue[],
    maxTimeMs: number,
    failReason: string,
    status: StateKey,
    comment: string
  ) => {
    const currentIssueIds = this._getIdsOfIssuesOfStatus(status)
    const updatedIssues = this._getUpdatedIssues(outdatedIssues, currentIssueIds)

    for (const issue of updatedIssues) {
      if (!this._isIssueProblematic(issue, maxTimeMs)) {
        continue
      }

      const fullIssue = this._issues.filter((fullIssue) => fullIssue.id === issue.id)[0]
      this._logger.warn(
        `Linear issue ${fullIssue ? `${fullIssue.identifier}` : `with ID ${issue.id}`} has been ${failReason}.`
      )

      const result = await this._linear.client.createComment({
        issueId: issue.id,
        body: comment,
      })
      issue.commentId = result.commentId
    }

    await this._resolveComments(outdatedIssues, updatedIssues)
    return updatedIssues
  }

  private _resolveComments = async (outdatedIssues: WatchedIssue[], newIssues: WatchedIssue[]) => {
    for (const issue of outdatedIssues) {
      if (!newIssues.some((newIssue) => newIssue.id === issue.id) && issue.commentId) {
        await this._linear.client.commentResolve(issue.commentId)
      }
    }
  }

  private _isIssueProblematic = (issue: WatchedIssue, maxTimeMs: number): boolean => {
    return !issue.commentId && !this._isDateValid(issue.sinceTimestamp, new Date().getTime(), maxTimeMs)
  }

  private _isDateValid = (initialTimestamp: number, currentTimestamp: number, maxIntervalMs: number) => {
    return currentTimestamp - initialTimestamp <= maxIntervalMs
  }

  private _getUpdatedIssues = (outdatedIssues: WatchedIssue[], currentIssueIds: string[]) => {
    const newIssues: WatchedIssue[] = []

    for (const issue of outdatedIssues) {
      if (currentIssueIds.includes(issue.id)) {
        newIssues.push(issue)
      }
    }

    for (const id of currentIssueIds) {
      if (!newIssues.some((issue) => issue.id === id)) {
        newIssues.push({ id, sinceTimestamp: new Date().getTime() })
      }
    }

    return newIssues
  }

  private _getIdsOfIssuesOfStatus = (status: StateKey): string[] => {
    const ids: string[] = []

    for (const issue of this._issues) {
      const issueState = this._linear.issueStatus(issue)
      if (issueState === status) {
        ids.push(issue.id)
      }
    }
    return ids
  }
}
