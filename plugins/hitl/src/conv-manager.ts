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
  public static from(props: types.AnyHandlerProps, convId: string): ConversationManager {
    return new ConversationManager(props, convId)
  }

  private constructor(
    private _props: types.AnyHandlerProps,
    private _convId: string
  ) {}

  public get conversationId(): string {
    return this._convId
  }

  public async setHumanAgent(humanAgentId: string, humanAgentName: string) {
    await this._patchConversationTags({ humanAgentId, humanAgentName })
  }

  public async isHumanAgentAssigned(): Promise<boolean> {
    const { humanAgentId } = await this._getConversationTags()

    return !!humanAgentId?.length
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
    const userId = await this._props.states.conversation.initiatingUser
      .get(this._convId)
      .then((state) => state.upstreamUserId)

    let eventBuilder = this._props.events.continueWorkflow.withConversationId(this._convId)
    if (userId) {
      eventBuilder = eventBuilder.withUserId(userId)
    }

    await eventBuilder.emit({
      conversationId: this._convId,
    })
  }

  public async respond({ type, ...messagePayload }: types.MessagePayload): Promise<void> {
    await this._props.client.createMessage({
      // FIXME: in the future, we should use the provided UserId so that messages
      //        on Botpress appear to come from the agent/user instead of the
      //        bot user. For now, this is not possible because of checks in the
      //        backend.
      type,
      userId: this._props.ctx.botId,
      conversationId: this._convId,
      payload: messagePayload,
      tags: {},
    })
  }

  public async abortHitlSession(errorMessage: string): Promise<void> {
    await this.setHitlInactive(HITL_END_REASON.INTERNAL_ERROR)
    await this.respond({ type: 'text', text: errorMessage })
  }

  public async setUserId(userId: string): Promise<void> {
    return await this._props.states.conversation.initiatingUser.set(this._convId, { upstreamUserId: userId })
  }

  private async _getHitlState(): Promise<bp.states.hitl.Hitl['payload']> {
    return await this._props.states.conversation.hitl.getOrSet(this._convId, DEFAULT_STATE)
  }

  private async _setHitlState(state: HitlState): Promise<void> {
    return await this._props.states.conversation.hitl.set(this._convId, state)
  }

  private async _patchConversationTags(tags: Record<string, string>): Promise<void> {
    await this._props.client.updateConversation({ id: this._convId, tags })
  }

  private async _getConversationTags(): Promise<Record<string, string>> {
    const {
      conversation: { tags },
    } = await this._props.client.getConversation({ id: this._convId })
    return tags
  }

  private async _toggleTypingIndicator(payload: TypingIndicatorState): Promise<void> {
    try {
      await this._props.client.setState({
        id: this._convId,
        type: 'conversation',
        name: TYPING_INDICATOR_STATE_NAME,
        payload,
      })
    } catch (thrown) {
      // because this state is hardcoded in the Studio / DM, it might not exist in some bot-as-code or ADK bots
      const errorMsg = thrown instanceof Error ? thrown.message : String(thrown)
      this._props.logger.withConversationId(this._convId).debug(`Could not set typing indicator state: ${errorMsg}`)
    }
  }
}
