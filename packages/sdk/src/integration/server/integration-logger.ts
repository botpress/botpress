import { BaseLogger } from '../../base-logger'

type IntegrationLogOptions = {
  userID?: string
  conversationID?: string
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

  public withUserID(userID: string) {
    return this.with({
      userID,
    })
  }

  public withConversationID(conversationID: string) {
    return this.with({
      conversationID,
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
