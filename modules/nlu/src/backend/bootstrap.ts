import * as sdk from 'botpress/sdk'
import bytes from 'bytes'
import _ from 'lodash'

import { Config } from '../config'

import { NLUApplication } from './application'
import { BotFactory } from './application/bot-factory'
import { InMemoryTrainingQueue } from './application/memory-training-queue'
import { NLUProgressEvent } from './typings'
import { BotService } from './application/bot-service'

export async function bootStrap(bp: typeof sdk): Promise<NLUApplication> {
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

  const botService = new BotService()
  const botFactory = new BotFactory(bp, engine, bp.logger, bp.NLU.modelIdService)

  // TODO: resolve an in-memory Vs database or distributed training queue depending on weither of not the botpress instance runs on multiple clusters
  const memoryTrainingQueue = new InMemoryTrainingQueue(bp.NLU.errors, socket, bp.logger, botService)
  const application = new NLUApplication(memoryTrainingQueue, engine, botFactory, botService)

  await application.initialize()
  return application
}
