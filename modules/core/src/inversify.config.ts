import 'reflect-metadata'
import { Container } from 'inversify'

import { TYPES } from './misc/types'
import { Logger } from './misc/interfaces'

import Database from './database'
import ConsoleLogger from './Logger'

const container = new Container({ autoBindInjectable: true })

container.bind<Logger>(TYPES.Logger_Database).to(ConsoleLogger)
container.bind<Database>(TYPES.Default).to(Database)

export { container }