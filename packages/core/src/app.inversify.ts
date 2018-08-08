import { Container } from 'inversify'
import path from 'path'

import { BotLoader } from './bot-loader'
import { Botpress } from './botpress'
import { ConfigProvider, GhostConfigProvider } from './config/config-loader'
import { DatabaseContainerModule } from './database/database.inversify'
import ConsoleLogger from './logger'
import { Logger } from './misc/interfaces'
import { applyDisposeOnExit } from './misc/inversify'
import { TYPES } from './misc/types'
import { ModuleLoader } from './module-loader'
import { RepositoriesContainerModule } from './repositories/repositories.inversify'
import HTTPServer from './server'
import { ServicesContainerModule } from './services/services.inversify'

const container = new Container({ autoBindInjectable: true })

// Binds the Logger name auto-magically on injection based on the `name` @tagged attribute
// Or else from the Symbol of the class in which the logger is being injected in
container.bind<string>(TYPES.Logger_Name).toDynamicValue(ctx => {
  const targetName = ctx.currentRequest.parentRequest!.target.name
  let loggerName = targetName && targetName.value()

  if (!loggerName) {
    // Was injected in a logger, which was injected in an other class
    // And that class has a service identifier, which may be a Symbol
    const endclass = ctx.currentRequest.parentRequest && ctx.currentRequest.parentRequest.parentRequest
    loggerName = endclass!.serviceIdentifier && endclass!.serviceIdentifier.toString().replace(/^Symbol\((.+)\)$/, '$1')
  }

  return loggerName || 'Unknown'
})

container.bind<Logger>(TYPES.Logger).to(ConsoleLogger)

container
  .bind<ModuleLoader>(TYPES.ModuleLoader)
  .to(ModuleLoader)
  .inSingletonScope()
container
  .bind<Botpress>(TYPES.Botpress)
  .to(Botpress)
  .inSingletonScope()
container.bind<HTTPServer>(TYPES.HTTPServer).to(HTTPServer)
container
  .bind<ConfigProvider>(TYPES.ConfigProvider)
  .to(GhostConfigProvider)
  .inSingletonScope()
container
  .bind<BotLoader>(TYPES.BotLoader)
  .to(BotLoader)
  .inSingletonScope()

const runningNode = process.title.endsWith('node')
const isProduction = !runningNode || process.env.NODE_ENV == 'production'

const projectLocation = runningNode
  ? path.join(__dirname, '..') // If we're running in DEV
  : path.join(path.dirname(process.execPath)) // If we're running from binary

container.bind<boolean>(TYPES.IsProduction).toConstantValue(isProduction)
container.bind<string>(TYPES.ProjectLocation).toConstantValue(projectLocation)

container.load(DatabaseContainerModule)
container.load(ServicesContainerModule)
container.load(RepositoriesContainerModule)

applyDisposeOnExit(container)

export { container }
