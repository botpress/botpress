import { BaseLogger } from '../../base-logger'

type IntegrationLogOptions = {
  userId?: string
  conversationId?: string
  traceId?: string
  visibleToBotOwners?: boolean
  hiddenToIntegrationOwners?: boolean
}

export class IntegrationLogger extends BaseLogger<IntegrationLogOptions> {
  public constructor(options?: IntegrationLogOptions) {
    super({
      visibleToBotOwners: false,
      hiddenToIntegrationOwners: false,
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
   * Used send the log to the bot owner
   */
  public withVisibleToBotOwners(visibleToBotOwners: boolean) {
    return this.with({
      visibleToBotOwners,
    })
  }

  /**
   * Used to *hide* the log from the integration owner
   */
  public withHiddenToIntegrationOwners(hiddenToIntegrationOwners: boolean) {
    return this.with({
      hiddenToIntegrationOwners,
    })
  }

  /**
   * Used to send the log to the bot owner _**and**_ the integration owner
   */
  public forBot() {
    return this.with({
      hiddenToIntegrationOwners: false,
      visibleToBotOwners: true,
    })
  }

  /**
   * Used to send the log _**only**_ to the bot owner and _**not**_ the integration owner
   */
  public forBotOnly() {
    return this.with({
      hiddenToIntegrationOwners: true,
      visibleToBotOwners: true,
    })
  }

  protected override getJsonMessage(msg: string) {
    return JSON.stringify({
      msg,
      //We need to have snake case 'visible_to_bot_owner' since that is how we used to differentiate between bot and integration logs
      visible_to_bot_owner: this.defaultOptions.visibleToBotOwners,
      hidden_to_integration_owner: this.defaultOptions.hiddenToIntegrationOwners,
      options: this.defaultOptions,
    })
  }
}
