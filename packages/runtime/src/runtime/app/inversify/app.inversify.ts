import { Logger } from 'botpress/runtime-sdk'
import { Container } from 'inversify'

import { ConfigProvider } from '../../config'
import { EventCollector } from '../../events'
import { LoggerDbPersister, LoggerFilePersister, LoggerProvider, PersistedConsoleLogger } from '../../logger'
import { MigrationService } from '../../migration'
import { TelemetryContainerModules, AnalyticsService } from '../../telemetry'
import { DataRetentionJanitor } from '../../users'
import { BotpressRuntimeAPIProvider } from '../api'
import { Botpress } from '../botpress'
import { HTTPServer } from '../server'
import { TYPES } from '../types'

import { DatabaseContainerModules } from './database.inversify'
import { RepositoriesContainerModules } from './repositories.inversify'
import { ServicesContainerModules } from './services.inversify'
import { applyDisposeOnExit, applyInitializeFromConfig } from './utils'

const container = new Container({ autoBindInjectable: true })

// Binds the Logger name auto-magically on injection based on the `name` @tagged attribute
// Or else from the Symbol of the class in which the logger is being injected in
container.bind<string>(TYPES.Logger_Name).toDynamicValue(ctx => {
  const targetName = ctx.currentRequest.parentRequest!.target.name
  const byProvider = ctx.plan.rootRequest.target.metadata.find(x => x.key === 'name')
  let loggerName = (targetName && targetName.value()) || (byProvider && byProvider.value)

  if (!loggerName) {
    // Was injected in a logger, which was injected in another class
    // And that class has a service identifier, which may be a Symbol
    const endclass = ctx.currentRequest.parentRequest && ctx.currentRequest.parentRequest.parentRequest

    if (endclass) {
      loggerName =
        endclass!.serviceIdentifier && endclass!.serviceIdentifier.toString().replace(/^Symbol\((.+)\)$/, '$1')
    }
  }

  return loggerName || ''
})

container.bind<Logger>(TYPES.Logger).to(PersistedConsoleLogger)
container.bind<LoggerProvider>(TYPES.LoggerProvider).toProvider<Logger>(context => {
  return async name => {
    return context.container.getTagged<Logger>(TYPES.Logger, 'name', name)
  }
})

container
  .bind<LoggerDbPersister>(TYPES.LoggerDbPersister)
  .to(LoggerDbPersister)
  .inSingletonScope()

container
  .bind<BotpressRuntimeAPIProvider>(TYPES.BotpressAPIProvider)
  .to(BotpressRuntimeAPIProvider)
  .inSingletonScope()

container
  .bind<HTTPServer>(TYPES.HTTPServer)
  .to(HTTPServer)
  .inSingletonScope()

container
  .bind<LoggerFilePersister>(TYPES.LoggerFilePersister)
  .to(LoggerFilePersister)
  .inSingletonScope()

container
  .bind<Botpress>(TYPES.Botpress)
  .to(Botpress)
  .inSingletonScope()

container
  .bind<ConfigProvider>(TYPES.ConfigProvider)
  .to(ConfigProvider)
  .inSingletonScope()

container
  .bind<AnalyticsService>(TYPES.Statistics)
  .to(AnalyticsService)
  .inSingletonScope()

container
  .bind<EventCollector>(TYPES.EventCollector)
  .to(EventCollector)
  .inSingletonScope()

container
  .bind<DataRetentionJanitor>(TYPES.DataRetentionJanitor)
  .to(DataRetentionJanitor)
  .inSingletonScope()

container
  .bind<MigrationService>(TYPES.MigrationService)
  .to(MigrationService)
  .inSingletonScope()

const isPackaged = !!eval('process.pkg')

container.bind<boolean>(TYPES.IsPackaged).toConstantValue(isPackaged)

container.load(...DatabaseContainerModules)
container.load(...RepositoriesContainerModules)
container.load(...ServicesContainerModules)
container.load(...TelemetryContainerModules)

applyDisposeOnExit(container)
applyInitializeFromConfig(container)

export { container }
