import { Logger } from 'botpress/sdk'
import { ConfigProvider } from 'core/config'
import Database from 'core/database'
import { JobService } from 'core/distributed'
import { EventEngine, EventRepository } from 'core/events'
import { TYPES } from 'core/types'
import { inject, injectable, postConstruct, tagged } from 'inversify'
import { MessagingCollector } from './subservices/collector'
import { MessagingEntries } from './subservices/entries'
import { MessagingInteractor } from './subservices/interactor'
import { MessagingLifetime } from './subservices/lifetime'
import { MessagingListener } from './subservices/listener'
import { MessagingMiddleware } from './subservices/middleware'
import { MessagingProxy } from './subservices/proxy'

@injectable()
export class MessagingService {
  public readonly entries: MessagingEntries
  public readonly interactor: MessagingInteractor
  public readonly lifetime: MessagingLifetime
  public readonly collector: MessagingCollector
  public readonly listener: MessagingListener
  public readonly middleware: MessagingMiddleware
  public readonly proxy: MessagingProxy

  constructor(
    @inject(TYPES.Database) private database: Database,
    @inject(TYPES.EventEngine) private eventEngine: EventEngine,
    @inject(TYPES.EventRepository) private eventRepo: EventRepository,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.JobService) private jobService: JobService,
    @inject(TYPES.Logger)
    @tagged('name', 'Messaging')
    private logger: Logger
  ) {
    this.entries = new MessagingEntries(this.database)
    this.interactor = new MessagingInteractor(this.logger)
    this.lifetime = new MessagingLifetime(
      this.logger,
      this.configProvider,
      this.jobService,
      this.entries,
      this.interactor
    )
    this.collector = new MessagingCollector(this.logger, this.eventEngine, this.interactor, this.lifetime)
    this.listener = new MessagingListener(
      this.eventEngine,
      this.eventRepo,
      this.interactor,
      this.lifetime,
      this.collector
    )
    this.middleware = new MessagingMiddleware(this.eventEngine, this.interactor, this.lifetime, this.collector)
    this.proxy = new MessagingProxy()
  }

  @postConstruct()
  async init() {
    await this.interactor.setup()
    await this.listener.setup()
    await this.middleware.setup()
    await this.interactor.postSetup()
  }
}
