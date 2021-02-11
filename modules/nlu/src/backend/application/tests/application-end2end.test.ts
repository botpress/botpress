import { NLU } from 'botpress/sdk'

import { DefinitionRepositoryFactory, ModelRepositoryFactory } from '../bot-factory'
import { TrainingQueueOptions } from '../memory-training-queue'

import { runTest } from './app-factory.test'
import { train_data_en, train_data_en_fr } from './data.test'
import { FakeDefinitionRepo } from './fake-def-repo.test'
import { FakeEngine } from './fake-engine.test'
import { FakeModelRepo } from './fake-model-repo.test'

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
        expect(socket.mock.calls.length).toBeGreaterThanOrEqual(5)
        expect(socket).toHaveBeenNthCalledWith(1, botId, expectTs({ status: 'training-pending' }))
        expect(socket).toHaveBeenNthCalledWith(2, botId, expectTs({ status: 'training' }))
      }
    )
  })

  test('When no model is on fs and 2 languages training should start on bot mount', async () => {
    // arrange
    const socket = jest.fn()
    const botId = 'myBot'
    const engine = new FakeEngine(['en', 'fr'])

    const { entities, intents } = train_data_en_fr

    const defRepo = new FakeDefinitionRepo()
    defRepo.initialize(intents, entities)

    const trainingQueueOptions: TrainingQueueOptions = { maxTraining: 2, jobInterval: 1 }

    await runTest(
      { socket, engine, trainingQueueOptions },
      async app => {
        // act
        await app.mountBot({
          id: botId,
          defaultLanguage: 'en',
          languages: ['en', 'fr']
        })
      },
      async () => {
        // assert
        expect(socket.mock.calls.length).toBeGreaterThanOrEqual(10)
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
    const fakeDefRepo = new FakeDefinitionRepo()

    const { entities, intents, modelId, nluSeed, lang } = train_data_en

    fakeDefRepo.initialize(intents, entities)
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
