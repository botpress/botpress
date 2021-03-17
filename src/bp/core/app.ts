import 'bluebird-global'
import LicensingService from 'common/licensing-service'
import { LoggerProvider } from 'core/logger'
import { LocalActionServer as LocalActionServerImpl } from 'core/services/action/local-action-server'
import { FatalError } from 'errors'
import 'reflect-metadata'

import { container } from './app.inversify'
import { Botpress as Core } from './botpress'
import { ConfigProvider } from './config/config-loader'
import Database from './database'
import { GhostService } from './services'
import { TYPES } from './types'

export interface BotpressApp {
  botpress: Core
  logger: LoggerProvider
  config: ConfigProvider
  ghost: GhostService
  database: Database
  localActionServer: LocalActionServerImpl
}

export function createApp(): BotpressApp {
  try {
    const app = {
      botpress: container.get<Core>(TYPES.Botpress),
      logger: container.get<LoggerProvider>(TYPES.LoggerProvider),
      config: container.get<ConfigProvider>(TYPES.ConfigProvider),
      ghost: container.get<GhostService>(TYPES.GhostService),
      database: container.get<Database>(TYPES.Database),
      localActionServer: container.get<LocalActionServerImpl>(TYPES.LocalActionServer),
      licensing: container.get<LicensingService>(TYPES.LicensingService)
    }

    app.licensing.installProtection()

    return app
  } catch (err) {
    throw new FatalError(err, 'Error during initialization')
  }
}

export function createLoggerProvider(): LoggerProvider {
  return container.get<LoggerProvider>(TYPES.LoggerProvider)
}
