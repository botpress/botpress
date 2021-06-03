import 'bluebird-global'
import LicensingService from 'common/licensing-service'
import { GhostService } from 'core/bpfs'
import { ConfigProvider } from 'core/config'
import Database from 'core/database'
import { LoggerProvider } from 'core/logger'
import { LocalActionServer as LocalActionServerImpl } from 'core/user-code'
import { FatalError } from 'errors'
import 'reflect-metadata'

import { Botpress as Core } from './botpress'
import { container } from './inversify/app.inversify'
import { TYPES } from './types'

export interface BotpressApp {
  botpress: Core
  logger: LoggerProvider
  config: ConfigProvider
  ghost: GhostService
  database: Database
  localActionServer: LocalActionServerImpl
}

let app: BotpressApp

export function createApp(): BotpressApp {
  if (app) {
    return app
  }

  try {
    app = {
      botpress: container.get<Core>(TYPES.Botpress),
      logger: container.get<LoggerProvider>(TYPES.LoggerProvider),
      config: container.get<ConfigProvider>(TYPES.ConfigProvider),
      ghost: container.get<GhostService>(TYPES.GhostService),
      database: container.get<Database>(TYPES.Database),
      localActionServer: container.get<LocalActionServerImpl>(TYPES.LocalActionServer)
    }

    const licensing = container.get<LicensingService>(TYPES.LicensingService)
    licensing.installProtection()

    return app
  } catch (err) {
    throw new FatalError(err, 'Error during initialization')
  }
}

export function createLoggerProvider(): LoggerProvider {
  return container.get<LoggerProvider>(TYPES.LoggerProvider)
}
