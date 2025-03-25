import { BaseLogger } from '../base-logger'

type BotLogOptions = {
  userId?: string
  conversationId?: string
  workflowId?: string
  eventId?: string
  messageId?: string
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

  public withWorkflowId(workflowId: string) {
    return this.with({
      workflowId,
    })
  }

  public withEventId(eventId: string) {
    return this.with({
      eventId,
    })
  }

  public withMessageId(messageId: string) {
    return this.with({
      messageId,
    })
  }
}
