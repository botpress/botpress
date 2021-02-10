import '../../../../../../src/bp/sdk/botpress'

// tslint:disable-next-line: ordered-imports
import { NLU } from 'botpress/sdk'
import { NLUApplication } from '..'
import { BotFactory, DefinitionRepositoryFactory, ModelRepositoryFactory } from '../bot-factory'
import { BotService } from '../bot-service'
import { InMemoryTrainingQueue, TrainSessionSocket } from '../memory-training-queue'
import { FakeLogger } from './fake-logger.test'
import { modelIdService } from './fake-model-id-service.test'

const fakeErrors: typeof NLU.errors = {
  isTrainingAlreadyStarted: () => false,
  isTrainingCanceled: () => false
}

// TODO: make this customizable with mocks
const makeFakeApp = (
  socket: TrainSessionSocket,
  modelRepoFactory: ModelRepositoryFactory,
  defRepoFactory: DefinitionRepositoryFactory,
  engine: NLU.Engine,
  errors: typeof NLU.errors = fakeErrors
) => {
  const fakeLogger = new FakeLogger()
  const botService = new BotService()
  const inMemoryTrainingQueue = new InMemoryTrainingQueue(fakeErrors, socket, fakeLogger, botService)
  const botFactory = new BotFactory(engine, fakeLogger, modelIdService, defRepoFactory, modelRepoFactory)
  return new NLUApplication(inMemoryTrainingQueue, engine, botFactory, botService)
}

describe('NLU API', () => {
  test('', () => {})
})
