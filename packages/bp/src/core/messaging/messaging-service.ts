import { Logger } from 'botpress/sdk'
import { ConfigProvider } from 'core/config'
import Database from 'core/database'
import { EventEngine, EventRepository } from 'core/events'
import { TYPES } from 'core/types'
import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { inject, injectable, postConstruct, tagged } from 'inversify'
import { MessagingChannels } from './channels'
import { MessagingCollector } from './collector'
import { MessagingInteractor } from './interactor'
import { MessagingLifetime } from './lifetime'
import { MessagingListener } from './listener'
import { MessagingMiddleware } from './middleware'

@injectable()
export class MessagingService {
  public readonly interactor: MessagingInteractor
  public readonly lifetime: MessagingLifetime
  public readonly collector: MessagingCollector
  public readonly listener: MessagingListener
  public readonly channels: MessagingChannels
  public readonly middleware: MessagingMiddleware

  constructor(
    @inject(TYPES.Database) private database: Database,
    @inject(TYPES.EventEngine) private eventEngine: EventEngine,
    @inject(TYPES.EventRepository) private eventRepo: EventRepository,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.Logger)
    @tagged('name', 'Messaging')
    private logger: Logger
  ) {
    this.interactor = new MessagingInteractor(this.logger)
    this.lifetime = new MessagingLifetime(this.logger, this.interactor, this.configProvider)
    this.collector = new MessagingCollector(this.logger, this.interactor, this.lifetime, this.eventEngine)
    this.listener = new MessagingListener(
      this.interactor,
      this.lifetime,
      this.collector,
      this.eventEngine,
      this.eventRepo
    )
    this.channels = new MessagingChannels(this.database)
    this.middleware = new MessagingMiddleware(this.interactor, this.lifetime, this.collector, this.eventEngine)
  }

  @postConstruct()
  async init() {
    await this.interactor.setup()
    await this.listener.setup()
    await this.middleware.setup()
    await this.interactor.postSetup()
  }

  async setupProxy(app: express.Express, baseApiPath: string) {
    app.use(
      `${baseApiPath}/messaging`,
      createProxyMiddleware({
        pathRewrite: path => {
          return path.replace(`${baseApiPath}/messaging`, '')
        },
        router: () => {
          return `http://localhost:${process.MESSAGING_PORT}`
        },
        changeOrigin: false,
        logLevel: 'silent'
      })
    )
  }
}
