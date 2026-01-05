import * as lin from '../utils/linear-utils'

const RECENT_THRESHOLD: number = 1000 * 60 * 10 // 10 minutes

export class RecentlyLintedManager {
  public constructor(private _linear: lin.LinearApi) {}

  public async isRecentlyLinted(issue: lin.Issue): Promise<boolean> {
    const me = await this._linear.getMe()
    const timestamps = issue.comments.nodes
      .filter((comment) => comment.user?.id === me.id)
      .map((comment) => new Date(comment.createdAt).getTime())
    const now = new Date().getTime()
    for (const timestamp of timestamps) {
      if (now - timestamp < RECENT_THRESHOLD) {
        return true
      }
    }
    return false
  }
}
