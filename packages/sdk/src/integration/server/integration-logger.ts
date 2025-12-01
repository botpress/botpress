import { BaseLogger } from '../../base-logger'

type IntegrationLogOptions = {
  userId?: string
  conversationId?: string
  traceId?: string
  visibleToBotOwners?: boolean
  isOnlyVisibleToBotOwners?: boolean
}

export class IntegrationLogger extends BaseLogger<IntegrationLogOptions> {
  public constructor(options?: IntegrationLogOptions) {
    super({
      visibleToBotOwners: false,
      isOnlyVisibleToBotOwners: false,
      ...options,
    })
  }

  public override with(options: IntegrationLogOptions) {
    return new IntegrationLogger({ ...this.defaultOptions, ...options })
  }

  public withUserId(userId: string) {
    return this.with({
      userId,
    })
  }

  public withConversationId(conversationId: string) {
    return this.with({
      conversationId,
    })
  }

  /**
   * Used to *also* send the log to the bot owner
   */
  public withVisibleToBotOwners(visibleToBotOwners: boolean) {
    return this.with({
      visibleToBotOwners,
    })
  }

  /**
   * Used to *not* send the log to the integration owner
   */
  public withOnlyVisibleToBotOwners(isOnlyVisibleToBotOwners: boolean) {
    return this.with({
      isOnlyVisibleToBotOwners,
    })
  }

  /**
   * Used to *also* send the log to the bot owner
   */
  public forBot() {
    return this.withVisibleToBotOwners(true)
  }

  /**
   * Used to *not* send the log to the integration owner
   */
  public forBotOnly() {
    return this.withOnlyVisibleToBotOwners(true)
  }

  protected override getJsonMessage(msg: string) {
    return JSON.stringify({
      msg,
      //We need to have snake case 'visible_to_bot_owner' since that is how we used to differentiate between bot and integration logs
      visible_to_bot_owner: this.defaultOptions.visibleToBotOwners,
      is_only_visible_to_bot_owner: this.defaultOptions.isOnlyVisibleToBotOwners,
      options: this.defaultOptions,
    })
  }
}
