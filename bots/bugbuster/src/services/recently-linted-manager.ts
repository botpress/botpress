import * as bp from '.botpress'

const RECENT_THRESHOLD: number = 1000 * 60 * 10 // 10 minutes
type IssueLintEntry = bp.states.recentlyLinted.RecentlyLinted['payload']['issues'][number]

export class RecentlyLintedManager {
  public constructor(
    private _client: bp.Client,
    private _botId: string
  ) {}

  public async getRecentlyLinted(): Promise<bp.states.recentlyLinted.RecentlyLinted['payload']['issues']> {
    const {
      state: {
        payload: { issues },
      },
    } = await this._client.getOrSetState({
      id: this._botId,
      type: 'bot',
      name: 'recentlyLinted',
      payload: { issues: [] },
    })
    return issues.filter(this._isRecentlyLinted)
  }

  public async setRecentlyLinted(issues: bp.states.recentlyLinted.RecentlyLinted['payload']['issues']): Promise<void> {
    await this._client.setState({
      id: this._botId,
      type: 'bot',
      name: 'recentlyLinted',
      payload: {
        issues: issues.filter(this._isRecentlyLinted),
      },
    })
  }

  private _isRecentlyLinted = (issue: IssueLintEntry): boolean => {
    const lintedAt = new Date(issue.lintedAt).getTime()
    const now = new Date().getTime()
    return now - lintedAt < RECENT_THRESHOLD
  }
}
