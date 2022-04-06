import { Logger } from 'botpress/sdk'
import { inject, injectable, tagged } from 'inversify'
import { ConfigProvider } from '../config'
import { EventEngine, EventRepository } from '../events'
import { TYPES } from '../types'
import { MessagingCollector } from './subservices/collector'
import { MessagingInteractor } from './subservices/interactor'
import { MessagingLifetime } from './subservices/lifetime'
import { MessagingListener } from './subservices/listener'
import { MessagingMiddleware } from './subservices/middleware'

@injectable()
export class MessagingService {
  public readonly interactor: MessagingInteractor
  public readonly lifetime: MessagingLifetime
  public readonly collector: MessagingCollector
  public readonly listener: MessagingListener
  public readonly middleware: MessagingMiddleware

  constructor(
    @inject(TYPES.EventEngine) private eventEngine: EventEngine,
    @inject(TYPES.EventRepository) private eventRepo: EventRepository,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.Logger)
    @tagged('name', 'Messaging')
    private logger: Logger
  ) {
    this.interactor = new MessagingInteractor(this.logger)
    this.lifetime = new MessagingLifetime(this.configProvider, this.interactor)
    this.collector = new MessagingCollector(this.logger, this.eventEngine, this.interactor, this.lifetime)
    this.listener = new MessagingListener(
      this.eventEngine,
      this.eventRepo,
      this.interactor,
      this.lifetime,
      this.collector
    )
    this.middleware = new MessagingMiddleware(this.eventEngine, this.interactor, this.lifetime, this.collector)
  }

  async initialize() {
    await this.interactor.setup()
    await this.listener.setup()
    await this.middleware.setup()
  }
}
