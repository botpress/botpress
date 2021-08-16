import { Client } from '@botpress/nlu-client'
import * as sdk from 'botpress/sdk'

import { makeNLUPassword } from 'common/nlu-token'
import _ from 'lodash'
import yn from 'yn'

import { Config, LanguageSource } from '../config'

import { getWebsocket } from './api'
import { BotFactory } from './application/bot-factory'
import { DefinitionsRepository } from './application/definitions-repository'
import { DbModelStateRepository } from './application/model-state-repo'
import { ModelStateService } from './application/model-state-service'
import { NLUClient } from './application/nlu-client'
import { NonBlockingNluApplication } from './application/non-blocking-app'

const getNLUServerConfig = (config: Config['nluServer']): LanguageSource => {
  if (config.autoStart) {
    return {
      endpoint: `http://localhost:${process.NLU_PORT}`,
      authToken: makeNLUPassword()
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
  const { queueTrainingOnBotMount, legacyElection } = globalConfig
  const trainingEnabled = !yn(process.env.BP_NLU_DISABLE_TRAINING)

  if (legacyElection) {
    bp.logger.warn(
      'You are still using legacy election which is deprecated. Set { legacyElection: false } in your global nlu config to use the new election pipeline.'
    )
  }

  const { endpoint, authToken } = getNLUServerConfig(globalConfig.nluServer)
  const stanClient = new Client(endpoint, authToken)

  const modelPassword = '' // No need for password as Stan is protected by an auth token
  const nluClient = new NLUClient(stanClient, modelPassword)

  const socket = getWebsocket(bp)

  const modelRepo = new DbModelStateRepository(bp.database)
  await modelRepo.initialize()
  const modelStateService = new ModelStateService(modelRepo)

  const defRepo = new DefinitionsRepository(bp)
  const botFactory = new BotFactory(nluClient, bp.logger, defRepo, modelStateService, socket)
  const application = new NonBlockingNluApplication(nluClient, botFactory, {
    queueTrainingsOnBotMount: trainingEnabled && queueTrainingOnBotMount
  })

  // don't block entire server startup
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  application.initialize()

  return application
}
