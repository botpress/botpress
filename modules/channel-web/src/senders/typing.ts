import { ChannelSender } from 'common/channel'
import { CHANNEL_NAME } from '../backend/socket'
import { WebContext } from '../backend/typings'

export class WebTypingSender implements ChannelSender<WebContext> {
  get channel(): string {
    return CHANNEL_NAME
  }

  get priority(): number {
    return -1
  }

  get id(): string {
    return WebTypingSender.name
  }

  handles(context: WebContext): boolean {
    const typing = context.event.payload.typing
    return context.handlers.length > 0 && (typing === undefined || typing === true)
  }

  async send(context: WebContext) {
    const { bp, event, conversationId } = context

    const delay = event.payload.delay ?? 1000

    const payload = bp.RealTimePayload.forVisitor(event.target, 'webchat.typing', {
      timeInMs: delay,
      conversationId
    })
    bp.realtime.sendPayload(payload)
  }
}
