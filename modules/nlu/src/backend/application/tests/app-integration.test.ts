import * as NLUEngine from './utils/sdk.u.test'
import _ from 'lodash'

import { makeApp, makeDependencies, waitForTrainingsToBeDone } from './utils/app.u.test'
import {
  expectEngineToHaveLoaded,
  expectEngineToHaveTrained,
  expectMaxSimultaneousTrainings,
  expectTrainingToStartAndComplete,
  expectTs
} from './utils/custom-expects.u.test'
import { book_flight, cityEntity, fruitEntity, hello, i_love_hockey } from './utils/data.u.test'
import { modelIdService } from './utils/fake-model-id-service.u.test'
import './utils/sdk.u.test'
import { areEqual, sleep } from './utils/utils.u.test'
import { TrainingSession } from '../typings'

const specs: NLUEngine.Specifications = {
  languageServer: {
    dimensions: 300,
    domain: 'lol',
    version: '1.0.0'
  },
  nluVersion: '1.0.0'
}

const botId = 'myBot'
const nluSeed = 42

const makeBaseDefinitions = (langs: string[]) => ({
  intentDefs: [hello(langs)],
  entityDefs: [fruitEntity]
})

/**
 * TODO:
 * - When unmounting a bot, all its trainings get canceled
 */

describe('NLU API integration tests', () => {
  test('When no model is on fs training should start on bot mount', async () => {
    // arrange
    const lang = 'en'
    const fileSystem = {
      [botId]: {
        definitions: makeBaseDefinitions([lang]),
        modelsOnFs: []
      }
    }

    const core = { languages: [lang], specs }
    const engineOptions = { nProgressCalls: 2 }
    const dependencies = makeDependencies(core, fileSystem, engineOptions)

    const { engine, socket, trainingRepo } = dependencies
    const engineTrainSpy = jest.spyOn(engine, 'train')
    const engineLoadSpy = jest.spyOn(engine, 'loadModel')

    const app = await makeApp(dependencies)

    // act
    await app.resumeTrainings()
    await app.mountBot({
      id: botId,
      defaultLanguage: lang,
      languages: [lang]
    })
    await waitForTrainingsToBeDone(app)

    // assert
    expect(socket).toHaveBeenCalledTimes(4)
    expect(socket).toHaveBeenNthCalledWith(1, expectTs({ botId, status: 'training-pending' }))
    expect(socket).toHaveBeenNthCalledWith(2, expectTs({ botId, status: 'training' }))
    expect(socket).toHaveBeenNthCalledWith(3, expectTs({ botId, status: 'training' }))
    expect(socket).toHaveBeenNthCalledWith(4, expectTs({ botId, status: 'done' }))

    const botTrainings = await trainingRepo.query({ botId })
    expect(botTrainings).toHaveLength(1)
    expect(botTrainings[0]).toMatchObject(expectTs({ botId, status: 'done' }))

    expect(engineTrainSpy).toHaveBeenCalledTimes(1)
    expect(engineLoadSpy).toHaveBeenCalledTimes(1)

    await app.teardown()
  })

  test('When no model is on fs and 2 languages training should start on bot mount', async () => {
    // arrange
    const languages = ['en', 'fr']
    const fileSystem = {
      [botId]: {
        definitions: makeBaseDefinitions(languages),
        modelsOnFs: []
      }
    }

    const nProgressCalls = 3
    const core = { languages, specs }
    const engineOptions = { nProgressCalls, trainDelayBetweenProgress: 10 }
    const dependencies = makeDependencies(core, fileSystem, engineOptions)

    const { engine, socket, trainingRepo } = dependencies

    const engineTrainSpy = jest.spyOn(engine, 'train')
    const engineLoadSpy = jest.spyOn(engine, 'loadModel')

    const maxTraining = 2
    const trainingQueueOptions = { maxTraining }
    const app = await makeApp(dependencies, trainingQueueOptions)

    // act
    await app.resumeTrainings()
    await app.mountBot({
      id: botId,
      defaultLanguage: 'en',
      languages
    })
    await waitForTrainingsToBeDone(app)

    // assert
    const nTrainings = 2
    expect(socket).toHaveBeenCalledTimes(nTrainings * (1 + nProgressCalls + 1))

    expectTrainingToStartAndComplete(socket, trainingRepo, { botId, language: 'en' })
    expectTrainingToStartAndComplete(socket, trainingRepo, { botId, language: 'fr' })

    const ts: TrainingSession[] = socket.mock.calls.map(([ts]) => ts)
    expectMaxSimultaneousTrainings(ts, maxTraining)

    expect(engineTrainSpy).toHaveBeenCalledTimes(nTrainings)
    expectEngineToHaveTrained(engineTrainSpy, 'en')
    expectEngineToHaveTrained(engineTrainSpy, 'fr')

    expect(engineLoadSpy).toHaveBeenCalledTimes(nTrainings)
    expectEngineToHaveLoaded(engineLoadSpy, 'en')
    expectEngineToHaveLoaded(engineLoadSpy, 'fr')

    await app.teardown()
  })

  test('When no model is on fs, 2 languages, max 1 training at a time, training should not occur simultaneously', async () => {
    // arrange
    const languages = ['en', 'fr']
    const fileSystem = {
      [botId]: {
        definitions: makeBaseDefinitions(languages),
        modelsOnFs: []
      }
    }

    const nProgressCalls = 3
    const core = { languages, specs }
    const engineOptions = { nProgressCalls, trainDelayBetweenProgress: 10 }
    const dependencies = makeDependencies(core, fileSystem, engineOptions)

    const { engine, socket, trainingRepo } = dependencies

    const engineTrainSpy = jest.spyOn(engine, 'train')
    const engineLoadSpy = jest.spyOn(engine, 'loadModel')

    const maxTraining = 1
    const trainingQueueOptions = { maxTraining }
    const app = await makeApp(dependencies, trainingQueueOptions)

    // act
    await app.resumeTrainings()
    await app.mountBot({
      id: botId,
      defaultLanguage: 'en',
      languages
    })
    await waitForTrainingsToBeDone(app)

    // assert
    const nTrainings = 2
    expect(socket).toHaveBeenCalledTimes(nTrainings * (1 + nProgressCalls + 1))

    expectTrainingToStartAndComplete(socket, trainingRepo, { botId, language: 'en' })
    expectTrainingToStartAndComplete(socket, trainingRepo, { botId, language: 'fr' })

    const ts: TrainingSession[] = socket.mock.calls.map(([ts]) => ts)
    expectMaxSimultaneousTrainings(ts, maxTraining)

    expect(engineTrainSpy).toHaveBeenCalledTimes(2)
    expectEngineToHaveTrained(engineTrainSpy, 'en')
    expectEngineToHaveTrained(engineTrainSpy, 'fr')

    expect(engineLoadSpy).toHaveBeenCalledTimes(2)
    expectEngineToHaveLoaded(engineLoadSpy, 'en')
    expectEngineToHaveLoaded(engineLoadSpy, 'fr')

    await app.teardown()
  })

  test('When no model is on fs, 3 multi-lang bots, max 2 training at a time, training occur in batch of two', async () => {
    // arrange
    const languages = ['en', 'fr']

    const botId1 = 'myBot1'
    const botId2 = 'myBot2'
    const botId3 = 'myBot3'

    const bot1 = {
      id: botId1,
      defaultLanguage: 'en',
      languages,
      definitions: {
        entityDefs: [],
        intentDefs: [hello(languages)]
      },
      modelsOnFs: []
    }

    const bot2 = {
      id: botId2,
      defaultLanguage: 'en',
      languages,
      definitions: {
        entityDefs: [cityEntity],
        intentDefs: [book_flight(languages)]
      },
      modelsOnFs: []
    }

    const bot3 = {
      id: botId3,
      defaultLanguage: 'en',
      languages: ['en'],
      definitions: {
        entityDefs: [fruitEntity],
        intentDefs: [i_love_hockey(['en'])]
      },
      modelsOnFs: []
    }

    const fileSystem = {
      [botId1]: bot1,
      [botId2]: bot2,
      [botId3]: bot3
    }

    const nProgressCalls = 3
    const core = { languages, specs }
    const engineOptions = { nProgressCalls, trainDelayBetweenProgress: 10 }
    const dependencies = makeDependencies(core, fileSystem, engineOptions)
    const { engine, socket, trainingRepo } = dependencies

    const engineTrainSpy = jest.spyOn(engine, 'train')
    const engineLoadSpy = jest.spyOn(engine, 'loadModel')

    const maxTraining = 2
    const trainingQueueOptions = { maxTraining }
    const app = await makeApp(dependencies, trainingQueueOptions)

    // act
    await app.resumeTrainings()
    await app.mountBot(bot1)
    await app.mountBot(bot2)
    await app.mountBot(bot3)
    await waitForTrainingsToBeDone(app)

    // assert
    const nTrainings = 5
    expect(socket).toHaveBeenCalledTimes((nProgressCalls + 2) * nTrainings)

    expectTrainingToStartAndComplete(socket, trainingRepo, { botId: botId1, language: 'en' })
    expectTrainingToStartAndComplete(socket, trainingRepo, { botId: botId1, language: 'fr' })
    expectTrainingToStartAndComplete(socket, trainingRepo, { botId: botId2, language: 'en' })
    expectTrainingToStartAndComplete(socket, trainingRepo, { botId: botId2, language: 'fr' })
    expectTrainingToStartAndComplete(socket, trainingRepo, { botId: botId3, language: 'en' })

    const ts: TrainingSession[] = socket.mock.calls.map(([ts]) => ts)
    expectMaxSimultaneousTrainings(ts, maxTraining)

    expect(engineTrainSpy).toHaveBeenCalledTimes(nTrainings)
    expectEngineToHaveTrained(engineTrainSpy, 'en')
    expectEngineToHaveTrained(engineTrainSpy, 'fr')

    expect(engineLoadSpy).toHaveBeenCalledTimes(nTrainings)
    expectEngineToHaveLoaded(engineLoadSpy, 'en')
    expectEngineToHaveLoaded(engineLoadSpy, 'fr')

    await app.teardown()
  })

  test('When a model is on fs no training should start on bot mount', async () => {
    // arrange
    const lang = 'en'

    const definitions = makeBaseDefinitions([lang])

    const modelId = modelIdService.makeId({
      ...definitions,
      languageCode: lang,
      seed: nluSeed,
      specifications: specs
    })

    const fileSystem = {
      [botId]: {
        definitions,
        modelsOnFs: [modelId]
      }
    }

    const core = { languages: [lang], specs }
    const dependencies = makeDependencies(core, fileSystem)

    const { engine, modelRepoByBot, socket } = dependencies

    const engineTrainSpy = jest.spyOn(engine, 'train')
    const engineLoadSpy = jest.spyOn(engine, 'loadModel')

    const fsHasModelMock = jest.spyOn(modelRepoByBot[botId], 'hasModel')
    const fsGetModelMock = jest.spyOn(modelRepoByBot[botId], 'getModel')

    const app = await makeApp(dependencies)

    // act
    await app.resumeTrainings()
    await app.mountBot({
      id: botId,
      defaultLanguage: lang,
      languages: [lang],
      nluSeed
    })

    // assert
    expect(socket).toHaveBeenCalledTimes(0)
    expect(fsHasModelMock).toHaveBeenCalledTimes(1)
    expect(fsGetModelMock.mock.calls.length).toBeGreaterThanOrEqual(1)

    expect(engineTrainSpy).toHaveBeenCalledTimes(0)
    expect(engineLoadSpy).toHaveBeenCalledTimes(1)
    expect(engineLoadSpy).toHaveBeenCalledWith(modelId)

    await app.teardown()
  })

  test('When 2 languages, but only one model on fs, only one training should start on bot mount', async () => {
    // arrange
    const languages = ['en', 'fr']
    const definitions = makeBaseDefinitions(languages)

    const modelEn = modelIdService.makeId({
      ...definitions,
      languageCode: 'en',
      seed: nluSeed,
      specifications: specs
    })

    const fileSystem = {
      [botId]: {
        definitions,
        modelsOnFs: [modelEn]
      }
    }

    const core = { languages, specs }
    const dependencies = makeDependencies(core, fileSystem)

    const { engine, socket, modelRepoByBot, trainingRepo } = dependencies

    const engineTrainSpy = jest.spyOn(engine, 'train')
    const engineLoadSpy = jest.spyOn(engine, 'loadModel')

    const fsHasModelMock = jest.spyOn(modelRepoByBot[botId], 'hasModel')
    const fsGetModelMock = jest.spyOn(modelRepoByBot[botId], 'getModel')

    const app = await makeApp(dependencies)

    // act
    await app.resumeTrainings()
    await app.mountBot({
      id: botId,
      defaultLanguage: 'en',
      languages: ['en', 'fr'],
      nluSeed
    })
    await waitForTrainingsToBeDone(app)

    // assert
    expect(socket).not.toHaveBeenCalledWith(expectTs({ botId, language: 'en' }))
    expectTrainingToStartAndComplete(socket, trainingRepo, { botId, language: 'fr' })

    expect(fsHasModelMock).toHaveBeenCalledTimes(2)
    expect(fsGetModelMock.mock.calls.length).toBeGreaterThanOrEqual(1)

    expect(engineTrainSpy).toHaveBeenCalledTimes(1)
    expectEngineToHaveTrained(engineTrainSpy, 'fr')

    expect(engineLoadSpy).toHaveBeenCalledTimes(2)
    expectEngineToHaveLoaded(engineLoadSpy, 'en')
    expectEngineToHaveLoaded(engineLoadSpy, 'fr')

    await app.teardown()
  })

  test('When no training needed, but updating definition files, socket is called with a needs-training event', async () => {
    // arrange
    const languages = ['en', 'fr']

    const definitions = makeBaseDefinitions(languages)

    const [modelEn, modelFr] = languages.map(lang =>
      modelIdService.makeId({
        ...definitions,
        languageCode: lang,
        seed: nluSeed,
        specifications: specs
      })
    )

    const fileSystem = {
      [botId]: {
        definitions,
        modelsOnFs: [modelEn, modelFr]
      }
    }

    const core = { languages, specs }
    const dependencies = makeDependencies(core, fileSystem)

    const { socket, defRepoByBot } = dependencies

    const app = await makeApp(dependencies)

    // act
    await app.resumeTrainings()

    await app.mountBot({
      id: botId,
      defaultLanguage: 'en',
      languages,
      nluSeed
    })

    const toUpdate = definitions.intentDefs[0]
    toUpdate.utterances['fr'].push('nouvelle utterance')
    await defRepoByBot[botId].upsertIntent(_.cloneDeep(toUpdate))

    // assert
    expect(socket).toHaveBeenCalledWith(expectTs({ botId, language: 'fr', status: 'needs-training' }))
    expect(socket).not.toHaveBeenCalledWith(expectTs({ botId, language: 'en' }))

    await app.teardown()
  })

  test('when an unexpected error occurs during training, socket receives an "errored" event, but reloading the pages gives a "needs-training" event', async () => {
    // arrange
    const lang = 'en'
    const fileSystem = {
      [botId]: {
        definitions: makeBaseDefinitions([lang]),
        modelsOnFs: []
      }
    }

    const core = { languages: [lang], specs }
    const dependencies = makeDependencies(core, fileSystem)
    const { engine, socket } = dependencies

    jest.spyOn(engine, 'train').mockImplementation(() => {
      throw new Error('Unexpected weird looking error with no stack trace')
    })

    const app = await makeApp(dependencies)

    // act
    await app.resumeTrainings()
    await app.mountBot({
      id: botId,
      defaultLanguage: 'en',
      languages: ['en'],
      nluSeed
    })
    await waitForTrainingsToBeDone(app)

    // assert
    expect(socket).toHaveBeenCalledWith(expectTs({ botId, language: 'en', status: 'errored' }))

    const currentTs = await app.getTraining(botId, 'en') // refresh browser page
    expect(currentTs.status).toBe('needs-training')

    await app.teardown()
  })

  test('when model is loaded, predict calls engine with the expected modelId', async () => {
    // arrange
    const lang = 'en'

    const definitions = makeBaseDefinitions([lang])

    const modelId = modelIdService.makeId({
      ...definitions,
      languageCode: lang,
      seed: nluSeed,
      specifications: specs
    })

    const fileSystem = {
      [botId]: {
        definitions,
        modelsOnFs: [modelId]
      }
    }

    const core = { languages: [lang], specs }
    const dependencies = makeDependencies(core, fileSystem)
    const { engine } = dependencies

    await engine.loadModel(modelId as NLUEngine.Model)
    const enginePredictSpy = jest.spyOn(engine, 'predict')

    const app = await makeApp(dependencies)

    // act
    await app.resumeTrainings()
    await app.mountBot({
      id: botId,
      defaultLanguage: lang,
      languages: [lang],
      nluSeed
    })

    const userInput = 'user input'
    const predictor = app.getBot(botId)
    const prediction = await predictor.predict(userInput, lang)

    // assert
    expect(enginePredictSpy).toHaveBeenNthCalledWith(1, userInput, modelId)

    await app.teardown()
  })

  test('when training is canceled, socket receives a "needs-training" event', async () => {
    // arrange
    const lang = 'en'
    const fileSystem = {
      [botId]: {
        definitions: makeBaseDefinitions([lang]),
        modelsOnFs: []
      }
    }

    const core = { languages: [lang], specs }
    const dependencies = makeDependencies(core, fileSystem)
    const { engine, socket } = dependencies

    const cancelMessage = 'CANCEL'
    jest.spyOn(engine, 'train').mockImplementation(() => {
      throw new Error(cancelMessage)
    })

    const errors: typeof NLUEngine.errors = {
      isTrainingAlreadyStarted: () => false,
      isTrainingCanceled: err => err.message === cancelMessage
    }

    const app = await makeApp({ ...dependencies, errors })

    // act
    await app.resumeTrainings()
    await app.mountBot({
      id: botId,
      defaultLanguage: lang,
      languages: [lang],
      nluSeed
    })
    await waitForTrainingsToBeDone(app)

    // assert
    expect(socket).toHaveBeenCalledWith(expectTs({ botId, language: lang, status: 'needs-training' }))
    const currentTs = await app.getTraining(botId, lang) // refresh browser page
    expect(currentTs.status).toBe('needs-training')

    await app.teardown()
  })

  test('canceling a training should call engine cancel', async () => {
    // arrange
    const lang = 'en'
    const fileSystem = {
      [botId]: {
        definitions: makeBaseDefinitions([lang]),
        modelsOnFs: []
      }
    }

    const core = { languages: [lang], specs }
    const dependencies = makeDependencies(core, fileSystem)
    const { engine } = dependencies

    const cancelMock = jest.spyOn(engine, 'cancelTraining')

    let cancelCalled = false
    const socket = jest.fn(async (ts: TrainingSession) => {
      if (!cancelCalled && ts.status === 'training') {
        app.cancelTraining(botId, ts.language)
        cancelCalled = true
      }
    })
    const app = await makeApp({ ...dependencies, socket })

    // act
    await app.resumeTrainings()
    await app.mountBot({
      id: botId,
      defaultLanguage: 'en',
      languages: ['en'],
      nluSeed
    })
    await waitForTrainingsToBeDone(app)

    // assert
    expect(cancelMock).toHaveBeenCalledTimes(1)
    expect(cancelMock).toHaveBeenCalledWith(expect.stringContaining('en'))

    await app.teardown()
  })

  test('updating train definitions during a training should still load training result', async () => {
    // arrange
    const lang = 'en'
    const definitions = makeBaseDefinitions([lang])
    const fileSystem = {
      [botId]: {
        definitions,
        modelsOnFs: []
      }
    }

    const core = { languages: [lang], specs }
    const dependencies = makeDependencies(core, fileSystem, { nProgressCalls: 3, trainDelayBetweenProgress: 10 })
    const { engine, defRepoByBot, modelRepoByBot } = dependencies

    const saveModel = jest.spyOn(modelRepoByBot[botId], 'saveModel')
    const loadModel = jest.spyOn(engine, 'loadModel')

    const socket = jest.fn(async (ts: TrainingSession) => {
      if (ts.status === 'training') {
        const toUpdate = definitions.intentDefs[0]
        toUpdate.utterances[lang].push('new utterance')
        await defRepoByBot[botId].upsertIntent(_.cloneDeep(toUpdate))
      }
    })
    const app = await makeApp({ ...dependencies, socket })

    // act
    await app.resumeTrainings()
    await app.mountBot({
      id: botId,
      defaultLanguage: lang,
      languages: [lang],
      nluSeed
    })

    await waitForTrainingsToBeDone(app)

    // assert
    expect(socket).not.toHaveBeenCalledWith(expectTs({ botId, status: 'needs-training' }))

    const [savedModel] = saveModel.mock.calls[0]
    expect(loadModel).toHaveBeenNthCalledWith(1, savedModel)

    const latestModelId = modelIdService.makeId({
      ...definitions,
      languageCode: lang,
      seed: nluSeed,
      specifications: specs
    })
    expect(areEqual(latestModelId, savedModel)).toBe(false) // current model is not synced with file system, but at least training finished and loaded

    await app.teardown()
  })

  test('when training is queued, training occurs', async () => {
    // arrange
    const lang = 'en'

    const definitions = makeBaseDefinitions([lang])

    const modelId = modelIdService.makeId({
      ...definitions,
      languageCode: lang,
      seed: nluSeed,
      specifications: specs
    })

    const fileSystem = {
      [botId]: {
        definitions,
        modelsOnFs: [modelId]
      }
    }

    const core = { languages: [lang], specs }
    const dependencies = makeDependencies(core, fileSystem)
    const { engine, socket, trainingRepo } = dependencies

    await engine.loadModel(modelId as NLUEngine.Model)
    const engineTrainSpy = jest.spyOn(engine, 'train')

    const app = await makeApp(dependencies)

    // act
    await app.resumeTrainings()
    await app.mountBot({
      id: botId,
      defaultLanguage: lang,
      languages: [lang],
      nluSeed
    })
    await app.queueTraining(botId, lang) // called from HTTP API
    await waitForTrainingsToBeDone(app)

    // assert
    expectTrainingToStartAndComplete(socket, trainingRepo, { botId, language: lang })
    expect(engineTrainSpy).toHaveBeenCalledTimes(1)
    expectEngineToHaveTrained(engineTrainSpy, lang)

    await app.teardown()
  })

  test('When bot is mounted, no training is queued when queueTrainingOnBotMount is false', async () => {
    // arrange
    const lang = 'en'

    const definitions = makeBaseDefinitions([lang])

    const modelId = modelIdService.makeId({
      ...definitions,
      languageCode: lang,
      seed: nluSeed,
      specifications: specs
    })

    const fileSystem = {
      [botId]: {
        definitions,
        modelsOnFs: [modelId]
      }
    }

    const core = { languages: [lang], specs }
    const dependencies = makeDependencies(core, fileSystem)

    const app = await makeApp(dependencies, { queueTrainingOnBotMount: false })
    const engineTrainSpy = jest.spyOn(dependencies.engine, 'train')

    // act
    await app.resumeTrainings()
    await app.mountBot({
      id: botId,
      defaultLanguage: lang,
      languages: [lang]
    })

    // assert
    expect(engineTrainSpy).toHaveBeenCalledTimes(0)
    expect(dependencies.socket).toHaveBeenCalledWith(expectTs({ botId, status: 'needs-training' }))
    expect(dependencies.socket).not.toHaveBeenCalledWith(expectTs({ botId, status: 'training-pending' }))

    await app.teardown()
  })

  test('Training queue starts out paused and does not start any training', async () => {
    // arrange
    const lang = 'en'

    const definitions = makeBaseDefinitions([lang])

    const modelId = modelIdService.makeId({
      ...definitions,
      languageCode: lang,
      seed: nluSeed,
      specifications: specs
    })

    const fileSystem = {
      [botId]: {
        definitions,
        modelsOnFs: [modelId]
      }
    }

    const core = { languages: [lang], specs }
    const dependencies = makeDependencies(core, fileSystem)

    const app = await makeApp(dependencies)
    const engineTrainSpy = jest.spyOn(dependencies.engine, 'train')

    // act

    await app.mountBot({
      id: botId,
      defaultLanguage: lang,
      languages: [lang]
    })
    await sleep(30) // ms

    expect(engineTrainSpy).not.toHaveBeenCalled()
    await app.resumeTrainings()

    await waitForTrainingsToBeDone(app)
    expect(engineTrainSpy).toHaveBeenCalled()

    expectTrainingToStartAndComplete(dependencies.socket, dependencies.trainingRepo, { botId, language: lang })

    await app.teardown()
  })

  test('Models are unloaded on bot unmount', async () => {
    // arrange
    const lang = 'en'
    const definitions = makeBaseDefinitions([lang])

    const modelId = modelIdService.makeId({
      ...definitions,
      languageCode: lang,
      seed: nluSeed,
      specifications: specs
    })

    const fileSystem = {
      [botId]: {
        definitions,
        modelsOnFs: [modelId]
      }
    }

    const core = { languages: [lang], specs }
    const dependencies = makeDependencies(core, fileSystem)

    const app = await makeApp(dependencies)
    const engineUnloadSpy = jest.spyOn(dependencies.engine, 'unloadModel')

    // act
    await app.mountBot({
      id: botId,
      defaultLanguage: lang,
      languages: [lang]
    })

    await app.resumeTrainings()
    await waitForTrainingsToBeDone(app)
    await app.unmountBot(botId)

    // assert
    expect(engineUnloadSpy).toHaveBeenCalled()
  })
})
