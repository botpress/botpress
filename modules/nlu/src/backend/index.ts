import 'bluebird-global'
import * as sdk from 'botpress/sdk'
import bytes from 'bytes'
import _ from 'lodash'
import { Config } from 'src/config'

import { createApi } from '../api'
import en from '../translations/en.json'
import es from '../translations/es.json'
import fr from '../translations/fr.json'

import { registerRouter, removeRouter } from './api'
import { NLUApplication } from './application'
import dialogConditions from './dialog-conditions'
import { registerMiddlewares, removeMiddlewares } from './middlewares'
import TrainSessionService from './train-session-service'
import { NLUProgressEvent, NLUState } from './typings'

let state: NLUState | undefined

const onServerStarted = async (bp: typeof sdk) => {
  const globalConfig: Config = await bp.config.getModuleConfig('nlu')

  const { ducklingEnabled, ducklingURL, languageSources, modelCacheSize } = globalConfig
  const parsedConfig: sdk.NLU.Config = {
    languageSources,
    ducklingEnabled,
    ducklingURL,
    modelCacheSize: bytes(modelCacheSize)
  }

  const logger = <sdk.NLU.Logger>{
    info: (msg: string) => bp.logger.info(msg),
    warning: (msg: string, err?: Error) => (err ? bp.logger.attachError(err).warn(msg) : bp.logger.warn(msg)),
    error: (msg: string, err?: Error) => (err ? bp.logger.attachError(err).error(msg) : bp.logger.error(msg))
  }

  const engine = await bp.NLU.makeEngine(parsedConfig, logger)

  const trainSessionService = new TrainSessionService(bp)

  const socket = async (botId: string, trainSession: sdk.NLU.TrainingSession) => {
    await trainSessionService.setTrainingSession(botId, trainSession)
    const ev: NLUProgressEvent = { type: 'nlu', botId, trainSession: _.omit(trainSession, 'lock') }
    bp.realtime.sendPayload(bp.RealTimePayload.forAdmins('statusbar.event', ev))
  }

  const app = new NLUApplication(bp, engine, trainSessionService, socket)

  state = {
    engine,
    application: app,
    trainSessionService
  }

  registerMiddlewares(bp, state)
}

const onServerReady = async (bp: typeof sdk) => {
  await registerRouter(bp, state)
}

const onBotMount = async (bp: typeof sdk, botId: string) => {
  await state.application.mountBot(botId)
}

const onBotUnmount = async (bp: typeof sdk, botId: string) => {
  return state.application.unmountBot(botId)
}

const onModuleUnmount = async (bp: typeof sdk) => {
  removeMiddlewares(bp)
  removeRouter(bp)
  await state.application.teardown()
}

const onTopicChanged = async (bp: typeof sdk, botId: string, oldName?: string, newName?: string) => {
  const isRenaming = !!(oldName && newName)
  const isDeleting = !newName

  if (!isRenaming && !isDeleting) {
    return
  }

  const api = await createApi(bp, botId)
  const intentDefs = await api.fetchIntentsWithQNAs()

  for (const intentDef of intentDefs) {
    const ctxIdx = intentDef.contexts.indexOf(oldName as string)
    if (ctxIdx !== -1) {
      intentDef.contexts.splice(ctxIdx, 1)

      if (isRenaming) {
        intentDef.contexts.push(newName!)
      }

      await api.updateIntent(intentDef.name, intentDef)
    }
  }
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  onBotMount,
  onBotUnmount,
  onModuleUnmount,
  dialogConditions,
  onTopicChanged,
  translations: { en, fr, es },
  definition: {
    name: 'nlu',
    moduleView: {
      stretched: true
    },
    menuIcon: 'translate',
    menuText: 'NLU',
    fullName: 'NLU',
    homepage: 'https://botpress.com'
  }
}

export default entryPoint
