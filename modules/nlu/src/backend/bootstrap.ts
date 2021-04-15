import * as sdk from 'botpress/sdk'

import _ from 'lodash'

import { Config } from '../config'

import { getWebsocket } from './api'
import { NLUApplication } from './application'
import { ScopedServicesFactory } from './application/bot-factory'
import { BotService } from './application/bot-service'
import { DistributedTrainingQueue } from './application/distributed-training-queue'
import { ScopedDefinitionsRepository } from './application/scoped/infrastructure/definitions-repository'
import { TrainingRepository } from './application/training-repo'
import { BotDefinition } from './application/typings'
import { StanEngine } from './stan'
import { StanClient } from './stan/client'
import modelIdService from './stan/model-id-service'

export async function bootStrap(bp: typeof sdk): Promise<NLUApplication> {
  const globalConfig: Config = await bp.config.getModuleConfig('nlu')
  const { maxTrainingPerInstance, queueTrainingOnBotMount, legacyElection } = globalConfig

  if (legacyElection) {
    bp.logger.warn(
      'You are still using legacy election which is deprecated. Set { legacyElection: false } in your global nlu config to use the new election pipeline.'
    )
  }

  const stanEndpoint = 'http://localhost:3200' // TODO: get this from config
  const stanClient = new StanClient(stanEndpoint)
  const engine = new StanEngine(stanClient, process.APP_SECRET)

  const socket = getWebsocket(bp)

  const botService = new BotService()

  const makeDefRepo = (bot: BotDefinition) => new ScopedDefinitionsRepository(bot, bp)

  const servicesFactory = new ScopedServicesFactory(engine, bp.logger, modelIdService, makeDefRepo)

  const trainRepo = new TrainingRepository(bp.database)
  const trainingQueue = new DistributedTrainingQueue(trainRepo, bp.logger, botService, bp.distributed, socket, {
    maxTraining: maxTrainingPerInstance
  })
  await trainingQueue.initialize()
  const application = new NLUApplication(trainingQueue, engine, servicesFactory, botService, queueTrainingOnBotMount)

  return application
}
