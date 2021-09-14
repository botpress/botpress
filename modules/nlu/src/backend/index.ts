import 'bluebird-global'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { registerRouter, removeRouter } from './api'
import { NLUApplication } from './application'
import { bootStrap } from './bootstrap'
import dialogConditions from './dialog-conditions'
import { registerMiddlewares, removeMiddlewares } from './middlewares'

class AppNotInitializedError extends Error {
  constructor() {
    super('NLU Application not initialized')
  }
}

let app: NLUApplication | undefined

const onServerStarted = async (bp: typeof sdk) => {}

const onServerReady = async (bp: typeof sdk) => {
  app = await bootStrap(bp)
  await registerMiddlewares(bp, app)

  if (app) {
    await registerRouter(bp, app)
  } else {
    return bp.logger.warn('NLU module is not initialized')
  }
}

const onBotMount = async (bp: typeof sdk, botId: string) => {
  if (!app) {
    return bp.logger.warn('NLU module is not initialized')
  }

  const botConfig = await bp.bots.getBotById(botId)
  if (!botConfig) {
    throw new Error(`No config found for bot ${botId}`)
  }
  await app.mountBot(botConfig)
}

const onBotUnmount = async (bp: typeof sdk, botId: string) => {
  if (!app) {
    return bp.logger.warn(`Bot ${botId} is not mounted`)
  }
  try {
    await app.unmountBot(botId)
  } catch (err) {
    bp.logger.warn(`Error while unloading bot ${botId}: ${err}`)
  }
}

const onModuleUnmount = async (bp: typeof sdk) => {
  if (!app) {
    throw new AppNotInitializedError()
  }

  await removeMiddlewares(bp)
  removeRouter(bp)
  await app.teardown()
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  onBotMount,
  onBotUnmount,
  onModuleUnmount,
  dialogConditions,
  definition: {
    name: 'nlu',
    noInterface: true
  }
}

export default entryPoint
