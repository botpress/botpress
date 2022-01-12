import 'bluebird-global'
import 'reflect-metadata'

import { FatalError } from '../../errors'
import { Botpress as Core } from '../app/botpress'
import { container } from '../app/inversify/app.inversify'
import { GhostService } from '../bpfs'
import { ConfigProvider } from '../config'
import Database from '../database'
import { LoggerProvider } from '../logger'

import { TYPES } from './types'

export interface BotpressApp {
  botpress: Core
  logger: LoggerProvider
  config: ConfigProvider
  ghost: GhostService
  database: Database
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
