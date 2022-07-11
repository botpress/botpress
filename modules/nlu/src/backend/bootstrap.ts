import * as sdk from 'botpress/sdk'

import _ from 'lodash'
import yn from 'yn'

import { Config } from '../config'

import { getWebsocket } from './api'
import { BotFactory } from './application/bot-factory'
import { DefinitionsRepository } from './application/definitions-repository'
import { ModelEntryRepository } from './application/model-entry'
import { NLUClient } from './application/nlu-client'
import { NonBlockingNluApplication } from './application/non-blocking-app'

const getNLUServerConfig = (config: Config['nluServer']): { endpoint: string } => {
  if (config.autoStart) {
    return {
      endpoint: `http://localhost:${process.NLU_PORT}`
    }
  }
  const { endpoint } = config
  return { endpoint }
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

  const { endpoint: nluEndpoint } = getNLUServerConfig(globalConfig.nluServer)
  const clientWrapper = new NLUClient(nluEndpoint)

  const socket = getWebsocket(bp)

  const modelRepo = new ModelEntryRepository(bp.database)
  await modelRepo.initialize()

  const defRepo = new DefinitionsRepository(bp)
  const botFactory = new BotFactory(nluEndpoint, bp.logger, defRepo, modelRepo, socket)
  const application = new NonBlockingNluApplication(
    clientWrapper,
    botFactory,
    {
      queueTrainingsOnBotMount: trainingEnabled && queueTrainingOnBotMount
    },
    bp.logger
  )

  // don't block entire server startup
  void application.initialize()

  return application
}
