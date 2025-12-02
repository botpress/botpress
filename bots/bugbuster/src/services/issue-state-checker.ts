import * as types from '../types'
import * as lin from '../utils/linear-utils'

export class IssueStateChecker {
  public constructor(private _linear: lin.LinearApi) {}

  public async getUpdatedIssuesOfState(
    previousStagingIssues: types.WatchedIssue[],
    currentStagingIssues: lin.Issue[],
    state: lin.StateKey
  ) {
    const currentIds = await this._getIdsOfIssuesOfState(currentStagingIssues, state)

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

  public getProblematicIssues(watchedIssues: types.WatchedIssue[], maxTimeInStateInMs: number): types.WatchedIssue[] {
    const problematicIssues: types.WatchedIssue[] = []
    for (const issue of watchedIssues) {
      if (this._isIssueProblematic(issue, maxTimeInStateInMs)) {
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

  private _getIdsOfIssuesOfState = async (issues: lin.Issue[], state: lin.StateKey): Promise<string[]> => {
    const ids: string[] = []
    for (const issue of issues) {
      const issueState = await this._linear.issueState(issue)
      if (issueState === state) {
        ids.push(issue.id)
      }
    }
    return ids
  }

  private _isIssueProblematic(issue: types.WatchedIssue, maxTimeInStateInMs: number): boolean {
    return !issue.commentId && !this._isDateValid(issue.sinceTimestamp, new Date().getTime(), maxTimeInStateInMs)
  }

  private _isDateValid(initialTimestamp: number, currentTimestamp: number, maxIntervalMs: number) {
    return currentTimestamp - initialTimestamp <= maxIntervalMs
  }
}
