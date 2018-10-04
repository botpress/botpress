import { Logger } from 'botpress/sdk'
import { Container } from 'inversify'
import path from 'path'
import yn from 'yn'

import { BotpressAPIProvider } from './api'
import { BotLoader } from './bot-loader'
import { Botpress } from './botpress'
import { BotConfigFactory, BotConfigWriter } from './config'
import { ConfigProvider, GhostConfigProvider } from './config/config-loader'
import { DatabaseContainerModules } from './database/database.inversify'
import { LoggerPersister, LoggerProvider, PersistedConsoleLogger } from './logger'
import { applyDisposeOnExit } from './misc/inversify'
import { ModuleLoader } from './module-loader'
import { RepositoriesContainerModules } from './repositories/repositories.inversify'
import HTTPServer from './server'
import { ServicesContainerModules } from './services/services.inversify'
import { TYPES } from './types'

const container = new Container({ autoBindInjectable: true })

// Binds the Logger name auto-magically on injection based on the `name` @tagged attribute
// Or else from the Symbol of the class in which the logger is being injected in
container.bind<string>(TYPES.Logger_Name).toDynamicValue(ctx => {
  const targetName = ctx.currentRequest.parentRequest!.target.name
  const byProvider = ctx.plan.rootRequest.target.metadata.find(x => x.key === 'name')
  let loggerName = (targetName && targetName.value()) || (byProvider && byProvider.value)

  if (!loggerName) {
    // Was injected in a logger, which was injected in an other class
    // And that class has a service identifier, which may be a Symbol
    const endclass = ctx.currentRequest.parentRequest && ctx.currentRequest.parentRequest.parentRequest

    if (endclass) {
      loggerName =
        endclass!.serviceIdentifier && endclass!.serviceIdentifier.toString().replace(/^Symbol\((.+)\)$/, '$1')
    }
  }

  return loggerName || 'Unknown'
})

container.bind<Logger>(TYPES.Logger).to(PersistedConsoleLogger)
container.bind<LoggerProvider>(TYPES.LoggerProvider).toProvider<Logger>(context => {
  return async name => {
    return context.container.getTagged<Logger>(TYPES.Logger, 'name', name)
  }
})

container
  .bind<LoggerPersister>(TYPES.LoggerPersister)
  .to(LoggerPersister)
  .inSingletonScope()

container // TODO Implement this
  .bind<BotpressAPIProvider>(TYPES.BotpressAPIProvider)
  .to(BotpressAPIProvider)
  .inSingletonScope()

container
  .bind<ModuleLoader>(TYPES.ModuleLoader)
  .to(ModuleLoader)
  .inSingletonScope()
container
  .bind<Botpress>(TYPES.Botpress)
  .to(Botpress)
  .inSingletonScope()
container
  .bind<HTTPServer>(TYPES.HTTPServer)
  .to(HTTPServer)
  .inSingletonScope()
container
  .bind<ConfigProvider>(TYPES.ConfigProvider)
  .to(GhostConfigProvider)
  .inSingletonScope()
container
  .bind<BotLoader>(TYPES.BotLoader)
  .to(BotLoader)
  .inSingletonScope()
container
  .bind<BotConfigFactory>(TYPES.BotConfigFactory)
  .to(BotConfigFactory)
  .inSingletonScope()
container
  .bind<BotConfigWriter>(TYPES.BotConfigWriter)
  .to(BotConfigWriter)
  .inSingletonScope()

const isPackaged = !!eval('process.pkg')
const isProduction = !yn(process.env.DEBUG) && (isPackaged || process.env.NODE_ENV == 'production')

const projectLocation = isPackaged
  ? path.join(path.dirname(process.execPath)) // We point at the binary path
  : path.join(__dirname, '..') // e.g. /dist/..

container.bind<boolean>(TYPES.IsProduction).toConstantValue(isProduction)
container.bind<boolean>(TYPES.IsPackaged).toConstantValue(isPackaged)
container.bind<string>(TYPES.ProjectLocation).toConstantValue(projectLocation)

container.load(...DatabaseContainerModules)
container.load(...RepositoriesContainerModules)
container.load(...ServicesContainerModules)

applyDisposeOnExit(container)

export { container }
