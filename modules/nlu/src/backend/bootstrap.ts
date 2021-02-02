import * as sdk from 'botpress/sdk'
import bytes from 'bytes'
import _ from 'lodash'

import { Config } from '../config'

import { NLUApplication } from './application'
import TrainSessionService from './train-session-service'
import { NLUProgressEvent, NLUState } from './typings'

export async function bootStrap(bp: typeof sdk): Promise<NLUState> {
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

  const socket = async (botId: string, trainSession: sdk.NLU.TrainingSession) => {
    const ev: NLUProgressEvent = { type: 'nlu', botId, trainSession }
    bp.realtime.sendPayload(bp.RealTimePayload.forAdmins('statusbar.event', ev))
  }

  const trainSessionService = new TrainSessionService(bp, socket)

  const application = new NLUApplication(bp, engine, trainSessionService)
  await application.initialize()

  return { application, trainSessionService, engine }
}
