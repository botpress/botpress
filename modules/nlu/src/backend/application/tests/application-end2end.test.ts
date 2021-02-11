import '../../../../../../src/bp/sdk/botpress'

// tslint:disable-next-line: ordered-imports
import { NLU } from 'botpress/sdk'

import { DefinitionRepositoryFactory, ModelRepositoryFactory } from '../bot-factory'
import { TrainingQueueOptions } from '../memory-training-queue'

import _ from 'lodash'
import { runTest } from './utils/app-factory.u.test'
import { expectTrainingsOccurInOrder, expectTrainingToStartAndComplete, expectTs } from './utils/custom-expects.u.test'
import { makeDatasets, makeDefinitions } from './utils/data.u.test'
import { FakeDefinitionRepo } from './utils/fake-def-repo.u.test'
import { FakeEngine } from './utils/fake-engine.u.test'
import { FakeModelRepo } from './utils/fake-model-repo.u.test'

describe('NLU API', () => {
  test('When no model is on fs training should start on bot mount', async () => {
    // arrange
    const socket = jest.fn()
    const botId = 'myBot'
    const lang = 'en'
    const engine = new FakeEngine([lang], { nProgressCalls: 2 })

    await runTest(
      { socket, engine },
      async app => {
        // act
        await app.mountBot({
          id: botId,
          defaultLanguage: lang,
          languages: [lang]
        })
      },
      async () => {
        // assert
        expect(socket).toHaveBeenCalledTimes(5)
        expect(socket).toHaveBeenNthCalledWith(1, botId, expectTs({ status: 'training-pending' }))
        expect(socket).toHaveBeenNthCalledWith(2, botId, expectTs({ status: 'training' }))
        expect(socket).toHaveBeenLastCalledWith(botId, expectTs({ status: 'done' }))

        const ts: NLU.TrainingSession[] = socket.mock.calls.map(([botId, ts]) => ts)
        expectTrainingsOccurInOrder(ts, [1])
      }
    )
  })

  test('When no model is on fs and 2 languages training should start on bot mount', async () => {
    // arrange
    const socket = jest.fn<Promise<void>, [string, NLU.TrainingSession]>()
    const botId = 'myBot'
    const languages = ['en', 'fr']
    const engine = new FakeEngine(languages, { nProgressCalls: 3, trainDelayBetweenProgress: 10 })
    const defRepo = new FakeDefinitionRepo(makeDefinitions(languages))

    const defRepoFactory = () => defRepo
    const trainingQueueOptions: TrainingQueueOptions = { maxTraining: 2, jobInterval: 1 }

    await runTest(
      { socket, engine, trainingQueueOptions, defRepoFactory },
      async app => {
        // act
        await app.mountBot({
          id: botId,
          defaultLanguage: 'en',
          languages
        })
      },
      async () => {
        // assert
        expect(socket).toHaveBeenCalledTimes(12)

        expectTrainingToStartAndComplete(socket, { botId, language: 'en' })
        expectTrainingToStartAndComplete(socket, { botId, language: 'fr' })

        const ts: NLU.TrainingSession[] = socket.mock.calls.map(([botId, ts]) => ts)
        expectTrainingsOccurInOrder(ts, [2])
      }
    )
  })

  test('When no model is on fs, 2 languages, max 1 training at a time, training should not occur simultaneously', async () => {
    // arrange
    const socket = jest.fn<Promise<void>, [string, NLU.TrainingSession]>()
    const botId = 'myBot'
    const languages = ['en', 'fr']
    const engine = new FakeEngine(languages, { nProgressCalls: 3, trainDelayBetweenProgress: 10 })
    const defRepo = new FakeDefinitionRepo(makeDefinitions(languages))

    const defRepoFactory = () => defRepo
    const trainingQueueOptions: TrainingQueueOptions = { maxTraining: 1, jobInterval: 1 }

    await runTest(
      { socket, engine, trainingQueueOptions, defRepoFactory },
      async app => {
        // act
        await app.mountBot({
          id: botId,
          defaultLanguage: 'en',
          languages
        })
      },
      async () => {
        // assert
        expect(socket).toHaveBeenCalledTimes(12)

        expectTrainingToStartAndComplete(socket, { botId, language: 'en' })
        expectTrainingToStartAndComplete(socket, { botId, language: 'fr' })

        const ts: NLU.TrainingSession[] = socket.mock.calls.map(([botId, ts]) => ts)
        expectTrainingsOccurInOrder(ts, [1, 1])
      }
    )
  })

  test('When no model is on fs, 3 multi-lang bots, max 2 training at a time, training occur in batch of two', async () => {
    // arrange
    const socket = jest.fn<Promise<void>, [string, NLU.TrainingSession]>()
    const botId1 = 'myBot1'
    const botId2 = 'myBot2'
    const botId3 = 'myBot3'

    const languages = ['en', 'fr']
    const nProgressCalls = 3
    const engine = new FakeEngine(languages, { nProgressCalls, trainDelayBetweenProgress: 10 })
    const defRepo = new FakeDefinitionRepo(makeDefinitions(languages))

    const defRepoFactory = () => defRepo
    const trainingQueueOptions: TrainingQueueOptions = { maxTraining: 2, jobInterval: 1 }

    await runTest(
      { socket, engine, trainingQueueOptions, defRepoFactory },
      async app => {
        // act
        await app.mountBot({
          id: botId1,
          defaultLanguage: 'en',
          languages
        })

        await app.mountBot({
          id: botId2,
          defaultLanguage: 'en',
          languages
        })

        await app.mountBot({
          id: botId3,
          defaultLanguage: 'en',
          languages: ['en']
        })
      },
      async () => {
        // assert
        const nTrainings = 5
        expect(socket).toHaveBeenCalledTimes((nProgressCalls + 3) * nTrainings)

        expectTrainingToStartAndComplete(socket, { botId: botId1, language: 'en' })
        expectTrainingToStartAndComplete(socket, { botId: botId1, language: 'fr' })
        expectTrainingToStartAndComplete(socket, { botId: botId2, language: 'en' })
        expectTrainingToStartAndComplete(socket, { botId: botId2, language: 'fr' })
        expectTrainingToStartAndComplete(socket, { botId: botId3, language: 'en' })

        const ts: NLU.TrainingSession[] = socket.mock.calls.map(([botId, ts]) => ts)
        expectTrainingsOccurInOrder(ts, [2, 2, 1])
      }
    )
  })

  test('When a model is on fs no training should start on bot mount', async () => {
    // arrange
    const lang = 'en'
    const nluSeed = 42
    const [dataset] = makeDatasets([lang], nluSeed)
    const { modelId, trainSet } = dataset

    const fakeDefRepo = new FakeDefinitionRepo(trainSet)
    const defRepoFactory: DefinitionRepositoryFactory = () => fakeDefRepo

    const fakeModelRepo = new FakeModelRepo()
    await fakeModelRepo.saveModel(modelId as NLU.Model)
    const fsHasModelMock = jest.spyOn(fakeModelRepo, 'hasModel')
    const fsGetModelMock = jest.spyOn(fakeModelRepo, 'getModel')
    const modelRepoFactory: ModelRepositoryFactory = () => fakeModelRepo

    const botId = 'myBot'
    const socket = jest.fn()

    await runTest(
      { socket, defRepoFactory, modelRepoFactory },
      async app => {
        // act
        await app.mountBot({
          id: botId,
          defaultLanguage: lang,
          languages: [lang],
          nluSeed
        })
      },
      async () => {
        // assert
        expect(socket).toHaveBeenCalledTimes(0)
        expect(fsHasModelMock).toHaveBeenCalledTimes(1)
        expect(fsGetModelMock.mock.calls.length).toBeGreaterThanOrEqual(1)
      }
    )
  })

  /**
   * TODO: add the following e2e tests
   * 1 - when 2 bots, one with invalid model and the second with valid, one training starts and the other loads from fs
   * 2 - when updating definitions, socket receives a "needs-training" event
   * 3 - when an unexpected error occurs during training, socket receives an "errored" event, but reloading the pages gives a "needs-training" event
   * 4 - when model is loaded, predict calls engine with the expected modelId
   * 5 - when training is canceled, socket receives a "canceled" event followed by a "needs-training" event
   */
})
