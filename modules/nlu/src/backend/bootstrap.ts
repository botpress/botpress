import * as sdk from 'botpress/sdk'

import crypto from 'crypto'
import _ from 'lodash'

import { Config, LanguageSource } from '../config'

import { getWebsocket } from './api'
import { ScopedServicesFactory } from './application/bot-factory'
import { BotService } from './application/bot-service'
import { DistributedTrainingQueue } from './application/distributed-training-queue'
import { NonBlockingNluApplication } from './application/non-blocking-app'
import { ScopedDefinitionsRepository } from './application/scoped/infrastructure/definitions-repository'
import { TrainingRepository } from './application/training-repo'
import { BotDefinition } from './application/typings'
import { StanEngine } from './stan'
import { StanClient } from './stan/client'

const makeNLUPassword = () => {
  const random = Math.random() * 10 ** 10
  const text = `${random}`
  return crypto
    .createHash('md5')
    .update(text)
    .digest('hex')
}

const getNLUServerConfig = (config: Config['nluServer']): LanguageSource => {
  if (config.autoStart) {
    process.NLU_PASSWORD = makeNLUPassword() // will be used by core
    return {
      endpoint: 'http://localhost:3200',
      authToken: process.NLU_PASSWORD
    }
  }

  const { endpoint, authToken } = config
  return {
    endpoint,
    authToken
  }
}

export async function bootStrap(bp: typeof sdk): Promise<NonBlockingNluApplication> {
  const globalConfig: Config = await bp.config.getModuleConfig('nlu')
  const { maxTrainingPerInstance, queueTrainingOnBotMount, legacyElection } = globalConfig

  if (legacyElection) {
    bp.logger.warn(
      'You are still using legacy election which is deprecated. Set { legacyElection: false } in your global nlu config to use the new election pipeline.'
    )
  }

  const { endpoint, authToken } = getNLUServerConfig(globalConfig.nluServer)
  const stanClient = new StanClient(endpoint, authToken)

  const modelPassword = '' // No need for password as Stan is protected by an auth token
  const engine = new StanEngine(stanClient, modelPassword)

  const socket = getWebsocket(bp)

  const botService = new BotService()

  const makeDefRepo = (bot: BotDefinition) => new ScopedDefinitionsRepository(bot, bp)

  const servicesFactory = new ScopedServicesFactory(engine, bp.logger, makeDefRepo)

  const trainRepo = new TrainingRepository(bp.database)
  const trainingQueue = new DistributedTrainingQueue(trainRepo, bp.logger, botService, bp.distributed, socket, {
    maxTraining: maxTrainingPerInstance
  })
  await trainingQueue.initialize()
  const application = new NonBlockingNluApplication(
    trainingQueue,
    engine,
    servicesFactory,
    botService,
    queueTrainingOnBotMount
  )

  // don't block entire server startup
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  application.initialize()

  return application
}
