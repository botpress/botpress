import * as bp from '.botpress'

export type BotProps = bp.EventHandlerProps | bp.MessageHandlerProps
export type BotMessage = Pick<bp.ClientInputs['createMessage'], 'type' | 'payload'>
export type GithubIssue = bp.integrations.github.actions.findTarget.output.Output['targets'][number]
export type IssueLintEntry = bp.states.recentlyLinted.RecentlyLinted['payload']['issues'][number]

const RECENT_THRESHOLD: number = 1000 * 60 * 10 // 10 minutes

export class BotpressApi {
  public constructor(
    private _client: bp.Client,
    private _botId: string
  ) {}

  public static async create(props: BotProps): Promise<BotpressApi> {
    return new BotpressApi(props.client, props.ctx.botId)
  }

  public async respond(conversationId: string, msg: BotMessage): Promise<void> {
    await this._client.createMessage({
      type: msg.type,
      payload: msg.payload,
      conversationId,
      userId: this._botId,
      tags: {},
    })
  }

  public async respondText(conversationId: string, msg: string): Promise<void> {
    return this.respond(conversationId, {
      type: 'text',
      payload: { text: msg },
    })
  }

  public listGithubIssues = async (): Promise<GithubIssue[]> => {
    const {
      output: { targets: githubIssues },
    } = await this._client.callAction({
      type: 'github:findTarget',
      input: {
        channel: 'issue',
        repo: 'botpress',
        query: '',
      },
    })
    return githubIssues
  }

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
