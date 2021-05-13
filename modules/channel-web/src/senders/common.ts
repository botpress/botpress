import { ChannelSender } from 'common/channel'
import { CHANNEL_NAME } from '../backend/socket'
import { WebContext } from '../backend/typings'

export class WebCommonSender implements ChannelSender<WebContext> {
  get channel(): string {
    return CHANNEL_NAME
  }

  get priority(): number {
    return 0
  }

  get id(): string {
    return WebCommonSender.name
  }

  handles(context: WebContext): boolean {
    return context.handlers.length > 0
  }

  async send(context: WebContext) {
    const { bp, event } = context

    for (const message of context.messages) {
      if (message.type === 'data') {
        const payload = bp.RealTimePayload.forVisitor(event.target, 'webchat.data', event.payload)
        bp.realtime.sendPayload(payload)
      } else {
        const message = await context.db.appendBotMessage(
          (event.payload || {}).botName || context.botName,
          (event.payload || {}).botAvatarUrl || context.botAvatarUrl,
          context.conversationId,
          event.payload,
          event.incomingEventId,
          event.id
        )
        bp.realtime.sendPayload(bp.RealTimePayload.forVisitor(event.target, 'webchat.message', message))
      }
    }
  }
}
