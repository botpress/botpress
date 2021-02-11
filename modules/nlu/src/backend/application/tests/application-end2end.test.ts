import '../../../../../../src/bp/sdk/botpress'

// tslint:disable-next-line: ordered-imports
import { NLU } from 'botpress/sdk'

import { DefinitionRepositoryFactory, ModelRepositoryFactory } from '../bot-factory'
import { TrainingQueueOptions } from '../memory-training-queue'

import { runTest } from './utils/app-factory.u.test'
import { makeDatasets, makeDefinitions } from './utils/data.u.test'
import { FakeDefinitionRepo } from './utils/fake-def-repo.u.test'
import { FakeEngine } from './utils/fake-engine.u.test'
import { FakeModelRepo } from './utils/fake-model-repo.u.test'

const expectTs = (ts: Partial<NLU.TrainingSession>) => expect.objectContaining<Partial<NLU.TrainingSession>>(ts)

describe('NLU API', () => {
  test('When no model is on fs training should start on bot mount', async () => {
    // arrange
    const socket = jest.fn()
    const botId = 'myBot'

    await runTest(
      { socket },
      async app => {
        // act
        await app.mountBot({
          id: botId,
          defaultLanguage: 'en',
          languages: ['en']
        })
      },
      async () => {
        // assert
        expect(socket.mock.calls.length).toBeGreaterThanOrEqual(4)
        expect(socket).toHaveBeenNthCalledWith(1, botId, expectTs({ status: 'training-pending' }))
        expect(socket).toHaveBeenNthCalledWith(2, botId, expectTs({ status: 'training' }))
        expect(socket).toHaveBeenLastCalledWith(botId, expectTs({ status: 'done' }))
      }
    )
  })

  test('When no model is on fs and 2 languages training should start on bot mount', async () => {
    // arrange
    const socket = jest.fn()
    const botId = 'myBot'
    const languages = ['en', 'fr']
    const engine = new FakeEngine(languages)
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
        expect(socket.mock.calls.length).toBeGreaterThanOrEqual(8)
        expect(socket).toHaveBeenCalledWith(botId, expectTs({ status: 'training-pending', language: 'en' }))
        expect(socket).toHaveBeenCalledWith(botId, expectTs({ status: 'training', language: 'en' }))
        expect(socket).toHaveBeenCalledWith(botId, expectTs({ status: 'done', language: 'en' }))
        expect(socket).toHaveBeenCalledWith(botId, expectTs({ status: 'training-pending', language: 'fr' }))
        expect(socket).toHaveBeenCalledWith(botId, expectTs({ status: 'training', language: 'fr' }))
        expect(socket).toHaveBeenCalledWith(botId, expectTs({ status: 'done', language: 'fr' }))
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
})
