import { BaseLogger } from '../base-logger'

type BotLogOptions = {
  userID?: string
  conversationID?: string
  workflowID?: string
}

export class BotLogger extends BaseLogger<BotLogOptions> {
  public constructor(options?: BotLogOptions) {
    super({
      ...options,
    })
  }

  public override with(options: BotLogOptions) {
    return new BotLogger({ ...this.defaultOptions, ...options })
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

  public withWorkflowID(workflowID: string) {
    return this.with({
      workflowID,
    })
  }
}
