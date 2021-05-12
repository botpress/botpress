import 'bluebird-global'
import { GhostService } from 'core/bpfs'
import { ConfigProvider } from 'core/config'
import Database from 'core/database'
import { LoggerProvider } from 'core/logger'
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
}

export function createApp(): BotpressApp {
  try {
    const app = {
      botpress: container.get<Core>(TYPES.Botpress),
      logger: container.get<LoggerProvider>(TYPES.LoggerProvider),
      config: container.get<ConfigProvider>(TYPES.ConfigProvider),
      ghost: container.get<GhostService>(TYPES.GhostService),
      database: container.get<Database>(TYPES.Database)
    }

    return app
  } catch (err) {
    throw new FatalError(err, 'Error during initialization')
  }
}

export function createLoggerProvider(): LoggerProvider {
  return container.get<LoggerProvider>(TYPES.LoggerProvider)
}
