import 'bluebird-global'
import LicensingService from 'common/licensing-service'
import { LocalActionServer as LocalActionServerImpl } from 'core/services/action/local-action-server'
import { FatalError } from 'errors'
import 'reflect-metadata'

import { container } from './app.inversify'
import { Botpress as Core } from './botpress'
import { ConfigProvider } from './config/config-loader'
import Database from './database'
import { LoggerProvider } from './logger/logger'
import { GhostService } from './services'
import { TYPES } from './types'

let botpress
let logger: LoggerProvider | undefined
let config: ConfigProvider | undefined
let ghost: GhostService | undefined
let database: Database | undefined
let localActionServer: LocalActionServerImpl | undefined

try {
  botpress = container.get<Core>(TYPES.Botpress)
  logger = container.get<LoggerProvider>(TYPES.LoggerProvider)
  config = container.get<ConfigProvider>(TYPES.ConfigProvider)
  ghost = container.get<GhostService>(TYPES.GhostService)
  database = container.get<Database>(TYPES.Database)
  localActionServer = container.get<LocalActionServerImpl>(TYPES.LocalActionServer)

  const licensing = container.get<LicensingService>(TYPES.LicensingService)
  licensing.installProtection()
} catch (err) {
  throw new FatalError(err, 'Error during initialization')
}

export const Botpress = botpress
export const Logger = logger!
export const Config = config
export const Ghost = ghost
export const Db = database
export const LocalActionServer = localActionServer
