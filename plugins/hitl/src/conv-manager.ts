import * as types from './types'
import * as bp from '.botpress'

// this state is hardcoded in the Studio/DM
type TypingIndicatorState = { enabled: boolean }
const TYPING_INDICATOR_STATE_NAME = 'typingIndicatorEnabled'

type HitlState = bp.states.hitl.Hitl['payload']

const DEFAULT_STATE: HitlState = { hitlActive: false }

export const HITL_END_REASON = {
  // PATIENT_LEFT: 'patient-left',
  PATIENT_USED_TERMINATION_COMMAND: 'patient-used-termination-command',
  AGENT_ASSIGNMENT_TIMEOUT: 'agent-assignment-timeout',
  // AGENT_RESPONSE_TIMEOUT: 'agent-response-timeout',
  AGENT_CLOSED_TICKET: 'agent-closed-ticket',
  CLOSE_ACTION_CALLED: 'close-action-called',
  INTERNAL_ERROR: 'internal-error',
} as const
type HitlEndReason = (typeof HITL_END_REASON)[keyof typeof HITL_END_REASON]

export class ConversationManager {
  public static from(props: types.AnyHandlerProps, conversation: types.ActionableConversation): ConversationManager {
    return new ConversationManager(props, conversation)
  }

  private constructor(
    private _props: types.AnyHandlerProps,
    private _conversation: types.ActionableConversation
  ) {}

  public get conversationId(): string {
    return this._conversation.id
  }

  public async setHumanAgent(humanAgentId: string, humanAgentName: string) {
    await this._patchConversationTags({ humanAgentId, humanAgentName })
  }

  public isHumanAgentAssigned(): boolean {
    return !!this._conversation.tags.humanAgentId?.length
  }

  public async isHitlActive(): Promise<boolean> {
    const hitlState = await this._getHitlState()
    return hitlState.hitlActive
  }

  public async setHitlActive(): Promise<void> {
    await this._setHitlState({ hitlActive: true })
    await this._toggleTypingIndicator({ enabled: false })
  }

  public async setHitlInactive(reason: HitlEndReason): Promise<void> {
    await Promise.all([
      this._setHitlState({ hitlActive: false }),
      this._patchConversationTags({ hitlEndReason: reason }),
      this._toggleTypingIndicator({ enabled: true }),
    ])
  }

  public async continueWorkflow(): Promise<void> {
    const initiatingUserId = await this._props.states.conversation.initiatingUser
      .get(this._conversation.id)
      .then((state) => state.upstreamUserId)

    let eventEmitter = this._props.events.continueWorkflow.withConversationId(this._conversation.id)

    if (initiatingUserId) {
      eventEmitter = eventEmitter.withUserId(initiatingUserId)
    }

    await eventEmitter.emit({
      conversationId: this._conversation.id,
    })
  }

  public async respond(messagePayload: types.MessagePayload): Promise<void> {
    // FIXME: in the future, we should use the provided UserId so that messages
    //        on Botpress appear to come from the agent/user instead of the
    //        bot user. For now, this is not possible because of checks in the
    //        backend.

    // FIXME: typescript has trouble narrowing the type here, so we use a switch
    //        statement as a workaround.
    switch (messagePayload.type) {
      case 'text':
        await this._conversation.createMessage({
          type: messagePayload.type,
          userId: this._props.ctx.botId,
          payload: messagePayload,
          tags: {},
        })
        break
      case 'image':
        await this._conversation.createMessage({
          type: messagePayload.type,
          userId: this._props.ctx.botId,
          payload: messagePayload,
          tags: {},
        })
        break
      case 'audio':
        await this._conversation.createMessage({
          type: messagePayload.type,
          userId: this._props.ctx.botId,
          payload: messagePayload,
          tags: {},
        })
        break
      case 'file':
        await this._conversation.createMessage({
          type: messagePayload.type,
          userId: this._props.ctx.botId,
          payload: messagePayload,
          tags: {},
        })
        break
      case 'video':
        await this._conversation.createMessage({
          type: messagePayload.type,
          userId: this._props.ctx.botId,
          payload: messagePayload,
          tags: {},
        })
        break
      case 'bloc':
        await this._conversation.createMessage({
          type: messagePayload.type,
          userId: this._props.ctx.botId,
          payload: messagePayload,
          tags: {},
        })
        break
      default:
        messagePayload satisfies never
    }
  }

  public async abortHitlSession(errorMessage: string): Promise<void> {
    await this.setHitlInactive(HITL_END_REASON.INTERNAL_ERROR)
    await this.respond({ type: 'text', text: errorMessage })
  }

  public async setUserId(userId: string): Promise<void> {
    return await this._props.states.conversation.initiatingUser.set(this._conversation.id, { upstreamUserId: userId })
  }

  private async _getHitlState(): Promise<bp.states.hitl.Hitl['payload']> {
    return await this._props.states.conversation.hitl.getOrSet(this._conversation.id, DEFAULT_STATE)
  }

  private async _setHitlState(state: HitlState): Promise<void> {
    return await this._props.states.conversation.hitl.set(this._conversation.id, state)
  }

  private async _patchConversationTags(tags: Record<string, string>): Promise<void> {
    await this._conversation.update({ tags })
  }

  private async _toggleTypingIndicator(payload: TypingIndicatorState): Promise<void> {
    try {
      await this._props.client.setState({
        id: this._conversation.id,
        type: 'conversation',
        name: TYPING_INDICATOR_STATE_NAME,
        payload,
      })
    } catch (thrown) {
      // because this state is hardcoded in the Studio / DM, it might not exist in some bot-as-code or ADK bots
      const errorMsg = thrown instanceof Error ? thrown.message : String(thrown)
      this._props.logger
        .withConversationId(this._conversation.id)
        .debug(`Could not set typing indicator state: ${errorMsg}`)
    }
  }
}
