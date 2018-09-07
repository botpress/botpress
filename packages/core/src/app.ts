import 'bluebird-global'
import 'reflect-metadata'

import { container } from './app.inversify'
import { Botpress as Core } from './botpress'
import { TYPES } from './misc/types'
import { LoggerProvider } from './Logger'

let botpress
let logger
try {
  botpress = container.get<Core>(TYPES.Botpress)
  logger = container.get<LoggerProvider>(TYPES.LoggerProvider)
} catch (e) {
  console.log(e)
}

export const Botpress = botpress
export const Logger = logger
