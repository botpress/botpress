import * as sdk from 'botpress/sdk'
import * as NLU from 'common/nlu/engine'
import _ from 'lodash'

import { Config } from '../config'

import { getWebsocket } from './api'
import { NLUApplication } from './application'
import { ScopedServicesFactory } from './application/bot-factory'
import { BotService } from './application/bot-service'
import { DistributedTrainingQueue } from './application/distributed-training-queue'
import { ScopedDefinitionsRepository } from './application/scoped/infrastructure/definitions-repository'
import { ScopedModelRepository } from './application/scoped/infrastructure/model-repository'
import { TrainingRepository } from './application/training-repo'
import { BotDefinition } from './application/typings'

export async function bootStrap(bp: typeof sdk): Promise<NLUApplication> {
  const globalConfig: Config = await bp.config.getModuleConfig('nlu')

  const {
    ducklingEnabled,
    ducklingURL,
    languageSources,
    modelCacheSize,
    maxTrainingPerInstance,
    queueTrainingOnBotMount
  } = globalConfig

  const parsedConfig: NLU.Config = {
    languageSources,
    ducklingEnabled,
    ducklingURL,
    modelCacheSize
  }

  const logger = <NLU.Logger>{
    info: (msg: string) => bp.logger.info(msg),
    warning: (msg: string, err?: Error) => (err ? bp.logger.attachError(err).warn(msg) : bp.logger.warn(msg)),
    error: (msg: string, err?: Error) => (err ? bp.logger.attachError(err).error(msg) : bp.logger.error(msg))
  }

  const engine = await NLU.makeEngine(parsedConfig, logger)

  const socket = getWebsocket(bp)

  const botService = new BotService()

  const makeModelRepo = (bot: BotDefinition) =>
    new ScopedModelRepository(bot, NLU.modelIdService, bp.ghost.forBot(bot.botId))

  const makeDefRepo = (bot: BotDefinition) => new ScopedDefinitionsRepository(bot, bp)

  const servicesFactory = new ScopedServicesFactory(engine, bp.logger, NLU.modelIdService, makeDefRepo, makeModelRepo)

  const trainRepo = new TrainingRepository(bp.database)
  const trainingQueue = new DistributedTrainingQueue(
    trainRepo,
    NLU.errors,
    bp.logger,
    botService,
    bp.distributed,
    socket,
    { maxTraining: maxTrainingPerInstance }
  )
  await trainingQueue.initialize()
  const application = new NLUApplication(trainingQueue, engine, servicesFactory, botService, queueTrainingOnBotMount)

  return application
}
