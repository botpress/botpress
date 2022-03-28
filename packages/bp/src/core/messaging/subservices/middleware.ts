import { IO } from 'botpress/sdk'
import { formatUrl, isBpUrl } from 'common/url'
import { EventEngine } from 'core/events'
import { MessagingCollector } from './collector'
import { MessagingInteractor } from './interactor'
import { MessagingLifetime } from './lifetime'

export class MessagingMiddleware {
  constructor(
    private eventEngine: EventEngine,
    private interactor: MessagingInteractor,
    private lifetime: MessagingLifetime,
    private collector: MessagingCollector
  ) {}

  async setup() {
    this.eventEngine.register({
      name: 'messaging.fixUrl',
      description: 'Fix payload url before sending them',
      order: 99,
      direction: 'outgoing',
      handler: this.fixOutgoingUrls.bind(this)
    })

    this.eventEngine.register({
      name: 'messaging.sendOut',
      description: 'Sends outgoing messages to external messaging',
      order: 20000,
      direction: 'outgoing',
      handler: this.handleOutgoingEvent.bind(this)
    })
  }

  private async handleOutgoingEvent(event: IO.OutgoingEvent, next: IO.MiddlewareNextCallback) {
    if (this.interactor.shouldSkipChannel(event.channel)) {
      return next(undefined, false, true)
    }

    const collecting = event.incomingEventId && this.collector.get(event.incomingEventId)
    const message = await this.interactor.client.createMessage(
      this.lifetime.getClientId(event.botId),
      event.threadId!,
      undefined,
      event.payload,
      collecting ? { incomingId: collecting } : undefined
    )
    event.messageId = message.id

    return next(undefined, true, false)
  }

  private async fixOutgoingUrls(event: IO.OutgoingEvent, next: IO.MiddlewareNextCallback) {
    this.fixPayloadUrls(event.payload)
    next()
  }

  private fixPayloadUrls(payload: any) {
    if (typeof payload !== 'object' || payload === null) {
      if (typeof payload === 'string') {
        payload = payload.replace('BOT_URL', process.EXTERNAL_URL)
      }

      if (isBpUrl(payload)) {
        payload = formatUrl(process.EXTERNAL_URL, payload)
      }
      return payload
    }

    for (const [key, value] of Object.entries(payload)) {
      if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          value[i] = this.fixPayloadUrls(value[i])
        }
      } else {
        payload[key] = this.fixPayloadUrls(value)
      }
    }

    return payload
  }
}
