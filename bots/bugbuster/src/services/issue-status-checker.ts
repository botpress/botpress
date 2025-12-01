import * as types from '../types'
import * as lin from '../utils/linear-utils'

const MAX_TIME_IN_STAGING = 7 * 24 * 60 * 60 * 1000 // 1 week in milliseconds

export class IssueStatusChecker {
  public constructor(private _linear: lin.LinearApi) {}

  public async getUpdatedStagingIssues(previousStagingIssues: types.WatchedIssue[], currentStagingIssues: lin.Issue[]) {
    const currentIds = await this._getIdsOfIssuesInStaging(currentStagingIssues)

    const newIssues: types.WatchedIssue[] = []
    for (const issue of previousStagingIssues) {
      if (currentIds.includes(issue.id)) {
        newIssues.push(issue)
      }
    }
    for (const id of currentIds) {
      if (!newIssues.some((issue) => issue.id === id)) {
        newIssues.push({ id, sinceTimestamp: new Date().getTime() })
      }
    }
    return newIssues
  }

  public getProblematicIssues(watchedIssues: types.WatchedIssue[]): types.WatchedIssue[] {
    const problematicIssues: types.WatchedIssue[] = []
    for (const issue of watchedIssues) {
      if (this._isIssueProblematic(issue)) {
        problematicIssues.push(issue)
      }
    }
    return problematicIssues
  }

  public async resolveComments(outdatedIssues: types.WatchedIssue[], newIssues: types.WatchedIssue[]) {
    for (const issue of outdatedIssues) {
      if (!newIssues.some((newIssue) => newIssue.id === issue.id) && issue.commentId) {
        await this._linear.client.commentResolve(issue.commentId)
      }
    }
  }

  private _getIdsOfIssuesInStaging = async (issues: lin.Issue[]): Promise<string[]> => {
    const ids: string[] = []
    for (const issue of issues) {
      const issueState = await this._linear.issueStatus(issue)
      if (issueState === 'STAGING') {
        ids.push(issue.id)
      }
    }
    return ids
  }

  private _isIssueProblematic(issue: types.WatchedIssue): boolean {
    return !issue.commentId && !this._isDateValid(issue.sinceTimestamp, new Date().getTime(), MAX_TIME_IN_STAGING)
  }

  private _isDateValid(initialTimestamp: number, currentTimestamp: number, maxIntervalMs: number) {
    return currentTimestamp - initialTimestamp <= maxIntervalMs
  }
}
