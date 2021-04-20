import { Logger, NLU } from 'botpress/sdk'
import _ from 'lodash'

import { NLUApplication } from '../../'
import { ScopedServicesFactory, DefinitionRepositoryFactory } from '../../bot-factory'
import { BotService } from '../../bot-service'
import { DistributedTrainingQueue } from '../../distributed-training-queue'
import { TrainingQueueOptions } from '../../training-queue'
import { TrainDefinitions } from '../../scoped/infrastructure/definitions-repository'

import { FakeTrainingRepository } from './fake-training-repo.u.test'
import { FakeDefinitionRepo } from './fake-def-repo.u.test'
import { FakeEngine, FakeEngineOptions } from './fake-engine.u.test'
import { StubLogger } from './stub-logger.u.test'
import { sleep } from './utils.u.test'

import { TrainingSession } from '../../typings'
import { FakeDistributed } from './fake-distributed.u.test'
import { Specifications } from '../../../stan/typings_v1'
import { IStanEngine } from '../../../stan'

interface AppDependencies {
  socket: jest.Mock<Promise<void>, [TrainingSession]>
  defRepoByBot: _.Dictionary<FakeDefinitionRepo>
  trainingRepo: FakeTrainingRepository
  distributed: FakeDistributed
  engine: IStanEngine
  logger: Logger
}

interface BotFileSystem {
  definitions: TrainDefinitions
}

interface CoreSpecs {
  languages: string[]
  specs: Specifications
}

export const makeDependencies = (
  core: CoreSpecs,
  fsByBot: _.Dictionary<BotFileSystem>,
  engineOptions: Partial<FakeEngineOptions> = {}
): AppDependencies => {
  const { languages, specs } = core

  const logger = new StubLogger()
  const socket = jest.fn()
  const engine = new FakeEngine(languages, specs, engineOptions)
  const defRepoByBot = _.mapValues(fsByBot, fs => new FakeDefinitionRepo(fs.definitions))

  const trainingRepo = new FakeTrainingRepository()
  const distributed = new FakeDistributed()

  return {
    logger,
    socket,
    engine,
    distributed,
    trainingRepo,
    defRepoByBot
  }
}

export const makeApp = async (
  dependencies: AppDependencies,
  options: Partial<TrainingQueueOptions & { queueTrainingOnBotMount?: boolean }> = {}
) => {
  const { socket, engine, logger, defRepoByBot, trainingRepo, distributed } = dependencies

  const defRepoFactory: DefinitionRepositoryFactory = ({ botId }) => defRepoByBot[botId]

  const botService = new BotService()

  const servicesFactory = new ScopedServicesFactory(engine, logger, defRepoFactory)

  const trainingQueue = new DistributedTrainingQueue(trainingRepo, logger, botService, distributed, socket, options)

  await trainingQueue.initialize()

  return new NLUApplication(trainingQueue, engine, servicesFactory, botService, options.queueTrainingOnBotMount)
}

export const waitForTrainingsToBeDone = async (app: NLUApplication) => {
  const allTrainings = await app.trainRepository.getAll()
  if (!allTrainings.length) {
    return true
  }

  let pendingOrRunning = true
  while (pendingOrRunning) {
    const allTrainings = await app.trainRepository.getAll()
    pendingOrRunning = allTrainings.some(ts =>
      (<NLU.TrainingStatus[]>['training', 'training-pending']).includes(ts.status)
    )
    if (!pendingOrRunning) {
      return true
    }
    await sleep(10)
  }
  return true
}
