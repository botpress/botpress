import { Logger, NLU } from 'botpress/sdk'
import _ from 'lodash'

import { NLUApplication } from '../../'
import { BotFactory, DefinitionRepositoryFactory, ModelRepositoryFactory } from '../../bot-factory'
import { BotService } from '../../bot-service'
import { InMemoryTrainingQueue, TrainingQueueOptions } from '../../memory-training-queue'
import { TrainDefinitions } from '../../scoped/typings'

import { FakeDefinitionRepo } from './fake-def-repo.u.test'
import { FakeEngine, FakeEngineOptions } from './fake-engine.u.test'
import { modelIdService } from './fake-model-id-service.u.test'
import { FakeModelRepo } from './fake-model-repo.u.test'
import './sdk.u.test'
import { StubLogger } from './stub-logger.u.test'
import { sleep } from './utils.u.test'

interface AppDependencies {
  socket: jest.Mock<Promise<void>, [string, NLU.TrainingSession]>
  modelRepoByBot: _.Dictionary<FakeModelRepo>
  defRepoByBot: _.Dictionary<FakeDefinitionRepo>
  engine: NLU.Engine
  errors: typeof NLU.errors
  logger: Logger
}

interface BotFileSystem {
  definitions: TrainDefinitions
  modelsOnFs: NLU.ModelId[]
}

interface CoreSpecs {
  languages: string[]
  specs: NLU.Specifications
}

export const makeDependencies = (
  core: CoreSpecs,
  fsByBot: _.Dictionary<BotFileSystem>,
  engineOptions: Partial<FakeEngineOptions> = {}
): AppDependencies => {
  const { languages, specs } = core
  const errors: typeof NLU.errors = {
    isTrainingAlreadyStarted: () => false,
    isTrainingCanceled: () => false
  }
  const logger = new StubLogger()
  const socket = jest.fn()
  const engine = new FakeEngine(languages, specs, engineOptions)
  const defRepoByBot = _.mapValues(fsByBot, fs => new FakeDefinitionRepo(fs.definitions))
  const modelRepoByBot = _.mapValues(fsByBot, fs => new FakeModelRepo(fs.modelsOnFs as NLU.Model[]))

  return {
    errors,
    logger,
    socket,
    engine,
    defRepoByBot,
    modelRepoByBot
  }
}

export const makeApp = (dependencies: AppDependencies, trainingQueueOptions: Partial<TrainingQueueOptions> = {}) => {
  const { socket, engine, errors, logger, defRepoByBot, modelRepoByBot } = dependencies

  const modelRepoFactory: ModelRepositoryFactory = ({ botId }) => modelRepoByBot[botId]
  const defRepoFactory: DefinitionRepositoryFactory = ({ botId }) => defRepoByBot[botId]

  const botService = new BotService()
  const botFactory = new BotFactory(engine, logger, modelIdService, defRepoFactory, modelRepoFactory)

  const trainingQueue = new InMemoryTrainingQueue(errors, logger, botService, socket, trainingQueueOptions)

  return new NLUApplication(trainingQueue, engine, botFactory, botService)
}

export const waitForTrainingsToBeDone = async (app: NLUApplication) => {
  const allTrainings = await app.getAllTrainings()
  if (!allTrainings.length) {
    return true
  }

  let pendingOrRunning = true
  while (pendingOrRunning) {
    const allTrainings = await app.getAllTrainings()
    pendingOrRunning = allTrainings.some(ts => ['training', 'training-pending'].includes(ts.status))
    if (!pendingOrRunning) {
      return true
    }
    await sleep(10)
  }
  return true
}
