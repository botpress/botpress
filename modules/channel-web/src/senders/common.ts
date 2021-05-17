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
        const message = await bp.experimental.messages
          .forBot(event.botId)
          .create(context.conversationId, event.payload, undefined, event.id, event.incomingEventId)
        bp.realtime.sendPayload(bp.RealTimePayload.forVisitor(event.target, 'webchat.message', message))
      }
    }
  }
}
