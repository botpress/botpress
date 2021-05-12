import { Logger } from 'botpress/sdk'
import { Botpress } from 'core/app/botpress'
import { HTTPServer } from 'core/app/server'
import { ConfigProvider } from 'core/config'
import { LoggerFilePersister, LoggerProvider, PersistedConsoleLogger } from 'core/logger'
import { ModuleLoader } from 'core/modules'
import { WorkspaceService } from 'core/users'
import { Container } from 'inversify'
import path from 'path'
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
  .bind<LoggerFilePersister>(TYPES.LoggerFilePersister)
  .to(LoggerFilePersister)
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
  .to(ConfigProvider)
  .inSingletonScope()

container
  .bind<WorkspaceService>(TYPES.WorkspaceService)
  .to(WorkspaceService)
  .inSingletonScope()

const isPackaged = !!eval('process.pkg')

container.bind<boolean>(TYPES.IsPackaged).toConstantValue(isPackaged)

container.load(...DatabaseContainerModules)
container.load(...RepositoriesContainerModules)
container.load(...ServicesContainerModules)

if (process.IS_PRO_ENABLED) {
  // Otherwise this will fail on compile when the submodule is not available.
  const ProContainerModule = require(path.resolve(process.PROJECT_LOCATION, 'pro/studio/pro.inversify'))
  container.load(ProContainerModule)
}

applyDisposeOnExit(container)
applyInitializeFromConfig(container)

export { container }
