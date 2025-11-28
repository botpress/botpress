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

  public withVisibleToBotOwners(visibleToBotOwners: boolean) {
    return this.with({
      visibleToBotOwners,
    })
  }

  public withOnlyVisibleToBotOwners(isOnlyVisibleToBotOwners: boolean) {
    return this.with({
      isOnlyVisibleToBotOwners,
    })
  }

  public forBoth() {
    return this.withVisibleToBotOwners(true)
  }

  public forBot() {
    return this.withOnlyVisibleToBotOwners(true)
  }

  protected override getJsonMessage(msg: string) {
    return JSON.stringify({
      msg,
      //We need to have snake case 'visible_to_bot_owner' since that is how we used to differentiate between bot and integration logs
      visible_to_bot_owner: this.defaultOptions.visibleToBotOwners,
      options: this.defaultOptions,
    })
  }
}
