import { uuid } from '@botpress/messaging-client'
import { IO, Logger } from 'botpress/sdk'
import { EventEngine } from 'core/events'
import LRUCache from 'lru-cache'
import ms from 'ms'
import { MessagingInteractor } from './interactor'
import { MessagingLifetime } from './lifetime'

export class MessagingCollector {
  private collectingCache: LRUCache<string, uuid>

  constructor(
    private logger: Logger,
    private eventEngine: EventEngine,
    private interactor: MessagingInteractor,
    private lifetime: MessagingLifetime
  ) {
    this.collectingCache = new LRUCache<string, uuid>({ max: 5000, maxAge: ms('5m') })
  }

  set(eventId: string, messageId: uuid) {
    this.collectingCache.set(eventId, messageId)
  }

  get(eventId: string) {
    return this.collectingCache[eventId]
  }

  informProcessingDone(event: IO.IncomingEvent) {
    if (this.collectingCache.get(event.id!)) {
      // We don't want the waiting for the queue to be empty to freeze other messages
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.sendProcessingDone(event)
    }
  }

  private async sendProcessingDone(event: IO.IncomingEvent) {
    try {
      await this.eventEngine.waitOutgoingQueueEmpty(event)
      await this.interactor.client.endTurn(this.lifetime.getClientId(event.botId), event.messageId!)
    } catch (e) {
      this.logger.attachError(e).error('Failed to inform messaging of completed processing')
    } finally {
      this.collectingCache.del(event.id!)
    }
  }
}
