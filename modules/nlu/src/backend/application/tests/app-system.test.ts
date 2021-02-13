import '../../../../../../src/bp/sdk/botpress'

// tslint:disable-next-line: ordered-imports
import { NLU } from 'botpress/sdk'

import { DefinitionRepositoryFactory, ModelRepositoryFactory } from '../bot-factory'
import { TrainingQueueOptions } from '../memory-training-queue'

import _ from 'lodash'
import { NLUApplication } from '..'
import { ENGINE_SPECS, runTest } from './utils/app-factory.u.test'
import {
  expectEngineToHaveLoaded,
  expectEngineToHaveTrained,
  expectTrainingsOccurInOrder,
  expectTrainingToStartAndComplete,
  expectTs
} from './utils/custom-expects.u.test'
import { makeDatasets, makeDefinitions } from './utils/data.u.test'
import { FakeDefinitionRepo } from './utils/fake-def-repo.u.test'
import { FakeEngine } from './utils/fake-engine.u.test'
import { FakeModelRepo } from './utils/fake-model-repo.u.test'

const botId = 'myBot'

describe('NLU API', () => {
  test('When no model is on fs training should start on bot mount', async () => {
    // arrange
    const socket = jest.fn()

    const lang = 'en'
    const engine = new FakeEngine([lang], ENGINE_SPECS, { nProgressCalls: 2 })

    const engineTrainMock = jest.spyOn(engine, 'train')
    const engineLoadMock = jest.spyOn(engine, 'loadModel')

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
        expect(socket).toHaveBeenCalledTimes(4)
        expect(socket).toHaveBeenNthCalledWith(1, botId, expectTs({ status: 'training-pending' }))
        expect(socket).toHaveBeenNthCalledWith(2, botId, expectTs({ status: 'training' }))
        expect(socket).toHaveBeenNthCalledWith(3, botId, expectTs({ status: 'training' }))
        expect(socket).toHaveBeenNthCalledWith(4, botId, expectTs({ status: 'done' }))

        const ts: NLU.TrainingSession[] = socket.mock.calls.map(([botId, ts]) => ts)
        expectTrainingsOccurInOrder(ts, [1])

        expect(engineTrainMock).toHaveBeenCalledTimes(1)
        expect(engineLoadMock).toHaveBeenCalledTimes(1)
      }
    )
  })

  test('When no model is on fs and 2 languages training should start on bot mount', async () => {
    // arrange
    const socket = jest.fn<Promise<void>, [string, NLU.TrainingSession]>()

    const languages = ['en', 'fr']

    const nProgressCalls = 3
    const engine = new FakeEngine(languages, ENGINE_SPECS, { nProgressCalls, trainDelayBetweenProgress: 10 })
    const engineTrainMock = jest.spyOn(engine, 'train')
    const engineLoadMock = jest.spyOn(engine, 'loadModel')

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
        const nTrainings = 2
        expect(socket).toHaveBeenCalledTimes(nTrainings * (1 + nProgressCalls + 1))

        expectTrainingToStartAndComplete(socket, { botId, language: 'en' })
        expectTrainingToStartAndComplete(socket, { botId, language: 'fr' })

        const ts: NLU.TrainingSession[] = socket.mock.calls.map(([botId, ts]) => ts)
        expectTrainingsOccurInOrder(ts, [2])

        expect(engineTrainMock).toHaveBeenCalledTimes(nTrainings)
        expectEngineToHaveTrained(engineTrainMock, 'en')
        expectEngineToHaveTrained(engineTrainMock, 'fr')

        expect(engineLoadMock).toHaveBeenCalledTimes(nTrainings)
        expectEngineToHaveLoaded(engineLoadMock, 'en')
        expectEngineToHaveLoaded(engineLoadMock, 'fr')
      }
    )
  })

  test('When no model is on fs, 2 languages, max 1 training at a time, training should not occur simultaneously', async () => {
    // arrange
    const socket = jest.fn<Promise<void>, [string, NLU.TrainingSession]>()

    const languages = ['en', 'fr']

    const nProgressCalls = 3
    const engine = new FakeEngine(languages, ENGINE_SPECS, { nProgressCalls, trainDelayBetweenProgress: 10 })
    const engineTrainMock = jest.spyOn(engine, 'train')
    const engineLoadMock = jest.spyOn(engine, 'loadModel')

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
        const nTrainings = 2
        expect(socket).toHaveBeenCalledTimes(nTrainings * (1 + nProgressCalls + 1))

        expectTrainingToStartAndComplete(socket, { botId, language: 'en' })
        expectTrainingToStartAndComplete(socket, { botId, language: 'fr' })

        const ts: NLU.TrainingSession[] = socket.mock.calls.map(([botId, ts]) => ts)
        expectTrainingsOccurInOrder(ts, [1, 1])

        expect(engineTrainMock).toHaveBeenCalledTimes(2)
        expectEngineToHaveTrained(engineTrainMock, 'en')
        expectEngineToHaveTrained(engineTrainMock, 'fr')

        expect(engineLoadMock).toHaveBeenCalledTimes(2)
        expectEngineToHaveLoaded(engineLoadMock, 'en')
        expectEngineToHaveLoaded(engineLoadMock, 'fr')
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

    const engine = new FakeEngine(languages, ENGINE_SPECS, { nProgressCalls, trainDelayBetweenProgress: 10 })
    const engineTrainMock = jest.spyOn(engine, 'train')
    const engineLoadMock = jest.spyOn(engine, 'loadModel')

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
        expect(socket).toHaveBeenCalledTimes((nProgressCalls + 2) * nTrainings)

        expectTrainingToStartAndComplete(socket, { botId: botId1, language: 'en' })
        expectTrainingToStartAndComplete(socket, { botId: botId1, language: 'fr' })
        expectTrainingToStartAndComplete(socket, { botId: botId2, language: 'en' })
        expectTrainingToStartAndComplete(socket, { botId: botId2, language: 'fr' })
        expectTrainingToStartAndComplete(socket, { botId: botId3, language: 'en' })

        const ts: NLU.TrainingSession[] = socket.mock.calls.map(([botId, ts]) => ts)
        expectTrainingsOccurInOrder(ts, [2, 2, 1])

        expect(engineTrainMock).toHaveBeenCalledTimes(nTrainings)
        expectEngineToHaveTrained(engineTrainMock, 'en')
        expectEngineToHaveTrained(engineTrainMock, 'fr')

        expect(engineLoadMock).toHaveBeenCalledTimes(nTrainings)
        expectEngineToHaveLoaded(engineLoadMock, 'en')
        expectEngineToHaveLoaded(engineLoadMock, 'fr')
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

    const engine = new FakeEngine([lang], ENGINE_SPECS)
    const engineTrainMock = jest.spyOn(engine, 'train')
    const engineLoadMock = jest.spyOn(engine, 'loadModel')

    const fakeModelRepo = new FakeModelRepo()
    await fakeModelRepo.saveModel(modelId as NLU.Model)
    const fsHasModelMock = jest.spyOn(fakeModelRepo, 'hasModel')
    const fsGetModelMock = jest.spyOn(fakeModelRepo, 'getModel')
    const modelRepoFactory: ModelRepositoryFactory = () => fakeModelRepo

    const socket = jest.fn()

    await runTest(
      { socket, defRepoFactory, modelRepoFactory, engine },
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

        expect(engineTrainMock).toHaveBeenCalledTimes(0)
        expect(engineLoadMock).toHaveBeenCalledTimes(1)
        expect(engineLoadMock).toHaveBeenCalledWith(modelId)
      }
    )
  })

  test('When 2 languages, but only one model on fs, only one training should start on bot mount', async () => {
    // arrange
    const nluSeed = 42
    const [dataset] = makeDatasets(['en'], nluSeed)
    const { modelId, trainSet } = dataset

    const engine = new FakeEngine(['en', 'fr'], ENGINE_SPECS, { nProgressCalls: 2 })
    const engineTrainMock = jest.spyOn(engine, 'train')
    const engineLoadMock = jest.spyOn(engine, 'loadModel')

    const fakeDefRepo = new FakeDefinitionRepo(trainSet)
    const defRepoFactory: DefinitionRepositoryFactory = () => fakeDefRepo

    const fakeModelRepo = new FakeModelRepo()
    await fakeModelRepo.saveModel(modelId as NLU.Model)
    const fsHasModelMock = jest.spyOn(fakeModelRepo, 'hasModel')
    const fsGetModelMock = jest.spyOn(fakeModelRepo, 'getModel')
    const modelRepoFactory: ModelRepositoryFactory = () => fakeModelRepo

    const socket = jest.fn()

    await runTest(
      { socket, engine, defRepoFactory, modelRepoFactory },
      async app => {
        // act
        await app.mountBot({
          id: botId,
          defaultLanguage: 'en',
          languages: ['en', 'fr'],
          nluSeed
        })
      },
      async () => {
        // assert
        expect(socket).not.toHaveBeenCalledWith(botId, expectTs({ language: 'en' }))
        expectTrainingToStartAndComplete(socket, { botId, language: 'fr' })

        expect(fsHasModelMock).toHaveBeenCalledTimes(2)
        expect(fsGetModelMock.mock.calls.length).toBeGreaterThanOrEqual(1)

        expect(engineTrainMock).toHaveBeenCalledTimes(1)
        expectEngineToHaveTrained(engineTrainMock, 'fr')

        expect(engineLoadMock).toHaveBeenCalledTimes(2)
        expectEngineToHaveLoaded(engineLoadMock, 'en')
        expectEngineToHaveLoaded(engineLoadMock, 'fr')
      }
    )
  })

  test('When no training needed, but updating definition files, socket is called with a needs-training event', async () => {
    // arrange
    const nluSeed = 42

    const [datasetEn, datasetFr] = makeDatasets(['en', 'fr'], nluSeed)
    const { modelId: modelEn, trainSet } = datasetEn
    const { modelId: modelFr } = datasetFr

    const fakeDefRepo = new FakeDefinitionRepo(trainSet)
    const defRepoFactory: DefinitionRepositoryFactory = () => fakeDefRepo

    const fakeModelRepo = new FakeModelRepo()
    await fakeModelRepo.saveModel(modelEn as NLU.Model)
    await fakeModelRepo.saveModel(modelFr as NLU.Model) // both langs lays on FS
    const modelRepoFactory: ModelRepositoryFactory = () => fakeModelRepo

    const socket = jest.fn()

    const engine = new FakeEngine(['en', 'fr'], ENGINE_SPECS)

    await runTest(
      { socket, engine, defRepoFactory, modelRepoFactory },
      async app => {
        // act
        await app.mountBot({
          id: botId,
          defaultLanguage: 'en',
          languages: ['en', 'fr'],
          nluSeed
        })

        const { intentDefs } = trainSet
        const intent = intentDefs[0]
        intent.utterances['fr'].push('new utterance')
        await fakeDefRepo.upsertIntent({ ...intent })
      },
      async () => {
        // assert
        expect(socket).toHaveBeenCalledWith(botId, expectTs({ language: 'fr', status: 'needs-training' }))
        expect(socket).not.toHaveBeenCalledWith(botId, expectTs({ language: 'en' }))
      }
    )
  })

  test('when an unexpected error occurs during training, socket receives an "errored" event, but reloading the pages gives a "needs-training" event', async () => {
    // arrange
    const nluSeed = 42

    const engine = new FakeEngine(['en'], ENGINE_SPECS, {
      trainingThrows: new Error('Unexpected weird looking error with no stack trace')
    })

    const socket = jest.fn()

    await runTest(
      { socket, engine },
      async app => {
        // act
        await app.mountBot({
          id: botId,
          defaultLanguage: 'en',
          languages: ['en'],
          nluSeed
        })
      },
      async app => {
        // assert
        expect(socket).toHaveBeenCalledWith(botId, expectTs({ language: 'en', status: 'errored' }))

        const currentTs = await app.getTraining(botId, 'en') // refresh browser page
        expect(currentTs.status).toBe('needs-training')
      }
    )
  })

  test('when model is loaded, predict calls engine with the expected modelId', async () => {
    // arrange
    const nluSeed = 42

    const [dataSet] = makeDatasets(['en'], nluSeed)
    const { modelId } = dataSet

    const engine = new FakeEngine(['en'], ENGINE_SPECS)
    await engine.loadModel(modelId as NLU.Model)

    const modelRepo = new FakeModelRepo()
    await modelRepo.saveModel(modelId as NLU.Model)
    const modelRepoFactory = () => modelRepo

    const socket = jest.fn()
    const enginePredictMock = jest.spyOn(engine, 'predict')

    const userInput = 'user input'

    await runTest(
      { socket, engine, modelRepoFactory },
      async app => {
        // act
        await app.mountBot({
          id: botId,
          defaultLanguage: 'en',
          languages: ['en'],
          nluSeed
        })

        const predictor = app.getBot(botId)
        const prediction = await predictor.predict(userInput, 'en')
      },
      async () => {
        // assert
        expect(enginePredictMock).toHaveBeenNthCalledWith(1, userInput, modelId)
      }
    )
  })

  test('when training is canceled, socket receives a "needs-training" event', async () => {
    // arrange
    const nluSeed = 42

    const cancelMessage = 'CANCEL'

    const engine = new FakeEngine(['en'], ENGINE_SPECS, {
      trainingThrows: new Error(cancelMessage)
    })

    const socket = jest.fn()

    const errors: typeof NLU.errors = {
      isTrainingAlreadyStarted: () => false,
      isTrainingCanceled: err => err.message === cancelMessage
    }

    await runTest(
      { socket, engine, errors },
      async app => {
        // act
        await app.mountBot({
          id: botId,
          defaultLanguage: 'en',
          languages: ['en'],
          nluSeed
        })
      },
      async app => {
        // assert
        expect(socket).toHaveBeenCalledWith(botId, expectTs({ language: 'en', status: 'needs-training' }))
        const currentTs = await app.getTraining(botId, 'en') // refresh browser page
        expect(currentTs.status).toBe('needs-training')
      }
    )
  })

  test('canceling a training should call engine cancel', async () => {
    // arrange
    const nluSeed = 42

    const engine = new FakeEngine(['en'], ENGINE_SPECS)
    const cancelMock = jest.spyOn(engine, 'cancelTraining')

    let application: NLUApplication | undefined
    const socket = async (botId: string, ts: NLU.TrainingSession) => {
      if (ts.status === 'training') {
        await application.cancelTraining(botId, ts.language)
      }
    }

    await runTest(
      { socket, engine },
      async app => {
        application = app
        // act
        await app.mountBot({
          id: botId,
          defaultLanguage: 'en',
          languages: ['en'],
          nluSeed
        })
      },
      async app => {
        // assert
        expect(cancelMock).toHaveBeenCalledTimes(1)
        expect(cancelMock).toHaveBeenCalledWith(expect.stringContaining('en'))
      }
    )
  })

  /**
   * TODO: add the following e2e tests
   * [X] - when 2 bots, one with invalid model and the second with valid, one training starts and the other loads from fs
   * [X] - when updating definitions, socket receives a "needs-training" event
   * [X] - when an unexpected error occurs during training, socket receives an "errored" event, but reloading the pages gives a "needs-training" event
   * [X] - when model is loaded, predict calls engine with the expected modelId
   * [X] - when training is canceled, socket receives a "canceled" event followed by a "needs-training" event
   */
})
