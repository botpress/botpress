import * as bp from '.botpress'

export type BotProps = bp.EventHandlerProps | bp.MessageHandlerProps
export type BotListeners = bp.states.listeners.Listeners['payload']
export type BotMessage = Pick<bp.ClientInputs['createMessage'], 'type' | 'payload'>
export type GithubIssue = bp.integrations.github.actions.findTarget.output.Output['targets'][number]

export class BotpressApi {
  private constructor(private _props: BotProps) {}

  public static async create(props: BotProps): Promise<BotpressApi> {
    return new BotpressApi(props)
  }

  public async respond(conversationId: string, msg: BotMessage): Promise<void> {
    const { client, ctx } = this._props
    await client.createMessage({
      type: msg.type,
      payload: msg.payload,
      conversationId,
      userId: ctx.botId,
      tags: {},
    })
  }

  public async respondText(conversationId: string, msg: string): Promise<void> {
    return this.respond(conversationId, {
      type: 'text',
      payload: { text: msg },
    })
  }

  public readListeners = async (): Promise<BotListeners> => {
    const {
      state: { payload: listeners },
    } = await this._props.client.getOrSetState({
      id: this._props.ctx.botId,
      type: 'bot',
      name: 'listeners',
      payload: {
        conversationIds: [],
      },
    })
    return listeners
  }

  public writeListeners = async (state: BotListeners) => {
    await this._props.client.setState({
      id: this._props.ctx.botId,
      type: 'bot',
      name: 'listeners',
      payload: state,
    })
  }

  public notifyListeners = async (message: BotMessage) => {
    const state = await this.readListeners()
    this._props.logger.info(`Sending message to ${state.conversationIds.length} conversation(s)`)
    for (const conversationId of state.conversationIds) {
      await this._props.client.createMessage({
        conversationId,
        userId: this._props.ctx.botId,
        tags: {},
        ...message,
      })
    }
  }

  public listGithubIssues = async (): Promise<GithubIssue[]> => {
    const {
      output: { targets: githubIssues },
    } = await this._props.client.callAction({
      type: 'github:findTarget',
      input: {
        channel: 'issue',
        repo: 'botpress',
        query: '',
      },
    })
    return githubIssues
  }
}
