import 'bluebird-global'
import LicensingService from 'common/licensing-service'
import { FatalError } from 'errors'
import 'reflect-metadata'

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

  const licensing = container.get<LicensingService>(TYPES.LicensingService)
  licensing.installProtection()
} catch (err) {
  throw new FatalError(err, 'Error during initialization')
}

export const Botpress = botpress
export const Logger = logger!
export const Config = config
