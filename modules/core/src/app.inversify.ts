import { Container } from 'inversify'
import path from 'path'

import { Botpress } from './botpress'
import { ConfigProvider, GhostConfigProvider } from './config/config-loader'
import Database from './database'
import ConsoleLogger from './logger'
import { MiddlewareService } from './middleware-service'
import { Logger } from './misc/interfaces'
import { TYPES } from './misc/types'
import { ModuleLoader } from './module-loader'
import { RepositoriesContainerModule } from './repositories/repositories.inversify'
import HTTPServer from './server'
import { GhostContentService } from './services/ghost-content'
import FSGhostContentService from './services/ghost-content/file-system'

const container = new Container({ autoBindInjectable: true })

// Binds the Logger name auto-magically on injection based on the `name` @tagged attribute
// Or else from the Symbol of the class in which the logger is being injected in
container.bind<string>(TYPES.Logger_Name).toDynamicValue(ctx => {
  const targetName = ctx.currentRequest.parentRequest.target.name
  let loggerName = targetName && targetName.value()

  if (!loggerName) {
    // Was injected in a logger, which was injected in an other class
    // And that class has a service identifier, which may be a Symbol
    const endclass = ctx.currentRequest.parentRequest && ctx.currentRequest.parentRequest.parentRequest
    loggerName = endclass.serviceIdentifier && endclass.serviceIdentifier.toString().replace(/^Symbol\((.+)\)$/, '$1')
  }

  return loggerName || 'Unknown'
})

container.bind<Logger>(TYPES.Logger).to(ConsoleLogger)
container
  .bind<Database>(TYPES.Database)
  .to(Database)
  .inSingletonScope()
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

const runningNode = process.title.endsWith('node')
const isProduction = !runningNode || process.env.NODE_ENV == 'production'

container.bind<MiddlewareService>(TYPES.MiddlewareService).to(MiddlewareService)

const projectLocation = runningNode
  ? path.join(__dirname, '..') // If we're running in DEV
  : path.join(path.dirname(process.execPath)) // If we're running from binary

container.bind<boolean>(TYPES.IsProduction).toConstantValue(isProduction)
container.bind<string>(TYPES.ProjectLocation).toConstantValue(projectLocation)
container
  .bind<GhostContentService>(TYPES.GhostService)
  .to(FSGhostContentService)
  .inSingletonScope()

container.load(RepositoriesContainerModule)

export { container }
