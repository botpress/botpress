import * as types from './types'
import * as bp from '.botpress'

type HitlState = bp.states.hitl.Hitl

const DEFAULT_STATE: HitlState = { hitlActive: false }

export type RespondProps = {
  text: string
  userId?: string
}

export class ConversationManager {
  public static from(props: types.AnyHandlerProps, convId: string): ConversationManager {
    return new ConversationManager(props, convId)
  }

  private constructor(
    private _props: types.AnyHandlerProps,
    private _convId: string
  ) {}

  public async getHitlState(): Promise<bp.states.hitl.Hitl> {
    const response = await this._props.client.getOrSetState({
      id: this._convId,
      type: 'conversation',
      name: 'hitl',
      payload: DEFAULT_STATE,
    })
    return response.state.payload
  }

  public async setHitlState(state: HitlState): Promise<void> {
    await this._props.client.setState({
      id: this._convId,
      type: 'conversation',
      name: 'hitl',
      payload: state,
    })
  }

  public async respond({ text, userId }: RespondProps): Promise<void> {
    await this._props.client.createMessage({
      userId: this._props.ctx.botId,
      conversationId: this._convId,
      type: 'text',
      payload: { text, userId },
      tags: {},
    })
  }
}
