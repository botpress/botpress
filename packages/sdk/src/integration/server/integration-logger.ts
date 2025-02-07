import { BaseLogger } from '../../base-logger'

type IntegrationLogOptions = {
  userId?: string
  conversationId?: string
  visibleToBotOwners?: boolean
}

export class IntegrationLogger extends BaseLogger<IntegrationLogOptions> {
  public constructor(options?: IntegrationLogOptions) {
    super({
      visibleToBotOwners: true,
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

  public forBot() {
    return this.withVisibleToBotOwners(true)
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
