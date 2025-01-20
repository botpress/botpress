import * as bp from '.botpress'

type HandlerProps =
  | bp.MessageHandlerProps
  | bp.EventHandlerProps
  | bp.HookHandlerProps['before_incoming_message']
  | bp.HookHandlerProps['before_incoming_event']

type HitlState = bp.states.hitl.Hitl

const DEFAULT_STATE: HitlState = { hitlActive: false }

export class ConversationManager {
  public static from(props: HandlerProps): ConversationManager {
    return new ConversationManager(props)
  }

  private constructor(private _props: HandlerProps) {}

  public async getHitlState(conversationId: string): Promise<bp.states.hitl.Hitl> {
    const response = await this._props.client.getOrSetState({
      id: conversationId,
      type: 'conversation',
      name: 'hitl',
      payload: DEFAULT_STATE,
    })
    return response.state.payload
  }

  public async setHitlState(conversationId: string, state: HitlState): Promise<void> {
    await this._props.client.setState({
      id: conversationId,
      type: 'conversation',
      name: 'hitl',
      payload: state,
    })
  }

  public async respond(conversationId: string, text: string): Promise<void> {
    await this._props.client.createMessage({
      userId: this._props.ctx.botId,
      conversationId,
      type: 'text',
      payload: { text },
      tags: {},
    })
  }
}
