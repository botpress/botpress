import { Logger, NLU } from 'botpress/sdk'
import ms from 'ms'

import { NLUApplication } from '../../'
import { BotFactory, DefinitionRepositoryFactory, ModelRepositoryFactory } from '../../bot-factory'
import { BotService } from '../../bot-service'
import { InMemoryTrainingQueue, TrainingQueueOptions } from '../../memory-training-queue'
import { TrainingQueue, TrainSessionListener } from '../../typings'

import { FakeDefinitionRepo } from './fake-def-repo.u.test'
import { FakeEngine, FakeEngineOptions } from './fake-engine.u.test'
import { FakeLogger } from './fake-logger.u.test'
import { modelIdService } from './fake-model-id-service.u.test'
import { FakeModelRepo } from './fake-model-repo.u.test'
import { sleep } from './utils.u.test'

const MAX_TIME_PER_TEST = ms('3 s')
const DEFAULT_TRAINING_DELAY = 1 // ms
const DEFAULT_PROGRESS_CALLS = 2 // ms
const DEFAULT_JOB_INTERVAL = 1 // ms

interface AppDependencies {
  socket: TrainSessionListener
  modelRepoFactory: ModelRepositoryFactory
  defRepoFactory: DefinitionRepositoryFactory
  engine: NLU.Engine
  trainingQueueOptions: TrainingQueueOptions
  errors: typeof NLU.errors
  logger: Logger
}

const makeDefaultDependencies = (): AppDependencies => {
  const socket: TrainSessionListener = async () => {}
  const modelRepoFactory = () => new FakeModelRepo()
  const defRepoFactory = () => new FakeDefinitionRepo()
  const fakeEngineOptions: FakeEngineOptions = {
    trainDelayBetweenProgress: DEFAULT_TRAINING_DELAY,
    nProgressCalls: DEFAULT_PROGRESS_CALLS
  }
  const engine = new FakeEngine(['en'], fakeEngineOptions)
  const trainingQueueOptions = {
    maxTraining: 1,
    jobInterval: DEFAULT_JOB_INTERVAL
  }
  const errors: typeof NLU.errors = {
    isTrainingAlreadyStarted: () => false,
    isTrainingCanceled: () => false
  }
  const logger = new FakeLogger()
  return {
    socket,
    modelRepoFactory,
    defRepoFactory,
    engine,
    trainingQueueOptions,
    errors,
    logger
  }
}

const makeApp = (deps: Partial<AppDependencies>) => {
  const defaultDeps = makeDefaultDependencies()
  const dependencies = { ...defaultDeps, ...deps }
  const { socket, modelRepoFactory, defRepoFactory, engine, trainingQueueOptions, errors, logger } = dependencies

  const botService = new BotService()
  const botFactory = new BotFactory(engine, logger, modelIdService, defRepoFactory, modelRepoFactory)

  const trainingQueue = new InMemoryTrainingQueue(errors, logger, botService, trainingQueueOptions)
  trainingQueue.listenForChange(socket)
  const app = new NLUApplication(trainingQueue, engine, botFactory, botService)

  return { app, trainingQueue }
}

const makeTrainingWaiter = (queue: TrainingQueue) => {
  return async () => {
    const allTrainings = await queue.getAllTrainings()
    if (!allTrainings.length) {
      return true
    }

    const doneStatus: NLU.TrainingStatus[] = ['done', 'errored', 'canceled']
    let allFinish = false
    while (!allFinish) {
      const allTrainings = await queue.getAllTrainings()
      allFinish = !allTrainings.some(ts => !doneStatus.includes(ts.status))
      if (allFinish) {
        return true
      }
      await sleep(MAX_TIME_PER_TEST / 100)
    }
    return true
  }
}

type Test = (app: NLUApplication) => Promise<void>
export const runTest = async (deps: Partial<AppDependencies>, act: Test, assert: Test) => {
  const { app, trainingQueue } = makeApp(deps)
  const waitForTrainingsToBeDone = makeTrainingWaiter(trainingQueue)

  await app.initialize()
  try {
    await act(app)
    const res = await Promise.race([sleep(MAX_TIME_PER_TEST), waitForTrainingsToBeDone()])
    if (!res) {
      throw new Error(`Test ${act.name} could not finish under ${MAX_TIME_PER_TEST} ms`)
    }
  } finally {
    await assert(app)
    await app.teardown()
  }
}
