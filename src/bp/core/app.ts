import 'bluebird-global'
import 'reflect-metadata'

import { FatalError } from 'errors'

import { container } from './app.inversify'
import { Botpress as Core } from './botpress'
import { ConfigProvider } from './config/config-loader'
import { LoggerProvider } from './logger/logger'
import { TYPES } from './types'

let botpress
let logger: LoggerProvider | undefined
let config: ConfigProvider | undefined

try {
  botpress = container.get<Core>(TYPES.Botpress)
  logger = container.get<LoggerProvider>(TYPES.LoggerProvider)
  config = container.get<ConfigProvider>(TYPES.ConfigProvider)
} catch (err) {
  throw new FatalError(err, 'Error during initialization')
}

export const Botpress = botpress
export const Logger = logger!
export const Config = config
