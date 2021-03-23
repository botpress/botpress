import * as NLUEngine from './utils/sdk.u.test'
import _ from 'lodash'

import { IModelRepository } from '../scoped/infrastructure/model-repository'
import { ScopedPredictionHandler } from '../scoped/prediction-handler'
import '../tests/utils/sdk.u.test'
import { StubLogger } from '../tests/utils/stub-logger.u.test'

import { mock } from './utils/mock-extra.u.test'

// TODO: use the new testing infrastructure

const frenchUtt = 'DONNE MOI UNE BANANE'
const englishUtt = 'GIVE ME A BANANA'
const germanUtt = 'GIB MIR EINE BANANE'

const fr = 'fr'
const en = 'en'
const de = 'de'

const stubLogger = new StubLogger()

const makeModelsByLang = (langs: string[]) => {
  const models: NLUEngine.ModelId[] = (<Partial<NLUEngine.ModelId>[]>(
    langs.map(l => ({ languageCode: l }))
  )) as NLUEngine.ModelId[]
  return _.zipObject(langs, models)
}

function makeEngineMock(loadedLanguages: string[]): NLUEngine.Engine {
  const loadedModels: NLUEngine.ModelId[] = (<Partial<NLUEngine.ModelId>[]>(
    loadedLanguages.map(l => ({ languageCode: l }))
  )) as NLUEngine.ModelId[]

  return (<Partial<NLUEngine.Engine>>{
    spellCheck: async (text: string, modelId: NLUEngine.ModelId) => text,

    getSpecifications: () => {
      return {
        nluVersion: '2.0.0',
        languageServer: {
          dimensions: 300,
          domain: 'bp',
          version: '1.0.0'
        }
      }
    },

    loadModel: async (m: NLUEngine.Model) => {
      loadedModels.push(m)
    },

    detectLanguage: async (textInput: string) => {
      let detectedLanguage = ''
      if (textInput === frenchUtt) {
        detectedLanguage = fr
      } else if (textInput === englishUtt) {
        detectedLanguage = en
      } else if (textInput === germanUtt) {
        detectedLanguage = de
      }
      return detectedLanguage
    },

    hasModel: (modelId: NLUEngine.ModelId) => loadedModels.map(m => m.languageCode).includes(modelId.languageCode),

    predict: jest.fn(async (textInput: string, modelId: NLUEngine.ModelId) => {
      if (loadedModels.map(m => m.languageCode).includes(modelId.languageCode)) {
        return <NLUEngine.PredictOutput>{
          entities: [],
          predictions: {}
        }
      }
      throw new Error('model not loaded')
    })
  }) as NLUEngine.Engine
}

function makeModelRepoMock(langsOnFs: string[]): IModelRepository {
  const getModel = async (modelId: Partial<NLUEngine.ModelId>) => {
    const { languageCode } = modelId
    if (langsOnFs.includes(languageCode)) {
      return <NLUEngine.Model>{
        startedAt: new Date(),
        finishedAt: new Date(),
        hash: languageCode,
        languageCode,
        contentHash: '',
        specificationHash: '',
        seed: 42,
        data: {
          input: '',
          output: ''
        }
      }
    }
  }
  return mock<IModelRepository>({
    getModel: jest.fn((m: NLUEngine.ModelId) => getModel(m)),
    getLatestModel: jest.fn(getModel)
  })
}

const modelIdService = (<Partial<typeof NLUEngine.modelIdService>>{
  toId: (m: NLUEngine.ModelId) => m,
  briefId: (q: { specifications: any; languageCode: string }) => ({
    languageCode: q.languageCode
  })
}) as typeof NLUEngine.modelIdService

const assertNoModelLoaded = (modelGetterMock: jest.Mock) => {
  assertModelLoaded(modelGetterMock, [])
}

const assertModelLoaded = (modelGetterMock: jest.Mock, langs: string[]) => {
  expect(modelGetterMock.mock.calls.length).toBe(langs.length)
  for (let i = 0; i < langs.length; i++) {
    expect(modelGetterMock.mock.calls[i][0].languageCode).toBe(langs[i])
  }
}

const assertPredictCalled = (enginePredictMock: jest.Mock, langs: string[]) => {
  expect(enginePredictMock.mock.calls.length).toBe(langs.length)
  for (let i = 0; i < langs.length; i++) {
    expect(enginePredictMock.mock.calls[i][1].languageCode).toBe(langs[i])
  }
}

const defaultLanguage = en
const anticipatedLang = fr

describe('predict', () => {
  test('predict with loaded detected language should use detected', async () => {
    // arrange
    const modelsOnFs = [en, fr, de]
    const modelRepo = makeModelRepoMock(modelsOnFs)
    const modelsInEngine = [en, fr, de]
    const engine = makeEngineMock(modelsInEngine)

    // act
    const predictionHandler = new ScopedPredictionHandler(
      { defaultLanguage },
      engine,
      modelRepo,
      modelIdService,
      makeModelsByLang(modelsInEngine),
      stubLogger
    )
    const result = await predictionHandler.predict(germanUtt, anticipatedLang)

    // assert
    expect(result).toBeDefined()
    expect(result.language).toBe(de)
    expect(result.detectedLanguage).toBe(de)

    assertPredictCalled(engine.predict as jest.Mock, [de])
    assertNoModelLoaded(modelRepo.getLatestModel as jest.Mock)
  })

  test('predict with unloaded detected language should load then predict', async () => {
    // arrange
    const modelsOnFs = [en, fr, de]
    const modelRepo = makeModelRepoMock(modelsOnFs)
    const modelsInEngine = [en, fr]
    const engine = makeEngineMock(modelsInEngine)

    // act
    const predictionHandler = new ScopedPredictionHandler(
      { defaultLanguage },
      engine,
      modelRepo,
      modelIdService,
      makeModelsByLang(modelsInEngine),
      stubLogger
    )
    const result = await predictionHandler.predict(germanUtt, anticipatedLang)

    // assert
    expect(result).toBeDefined()
    expect(result.language).toBe(de)
    expect(result.detectedLanguage).toBe(de)

    assertPredictCalled(engine.predict as jest.Mock, [de])
    assertModelLoaded(modelRepo.getLatestModel as jest.Mock, [de])
  })

  test('predict with no model for detected language should fallback on anticipated', async () => {
    // arrange
    const modelsOnFs = [en, fr]
    const modelRepo = makeModelRepoMock(modelsOnFs)
    const modelsInEngine = [en, fr]
    const engine = makeEngineMock(modelsInEngine)

    // act
    const predictionHandler = new ScopedPredictionHandler(
      { defaultLanguage },
      engine,
      modelRepo,
      modelIdService,
      makeModelsByLang(modelsInEngine),
      stubLogger
    )
    const result = await predictionHandler.predict(germanUtt, anticipatedLang)

    // assert
    expect(result).toBeDefined()
    expect(result.language).toBe(fr)
    expect(result.detectedLanguage).toBe(de)

    assertPredictCalled(engine.predict as jest.Mock, [fr])
    assertModelLoaded(modelRepo.getLatestModel as jest.Mock, [de])
  })

  test('predict with no model for detected lang and unloaded anticipated lang should load anticipated', async () => {
    // arrange
    const modelsOnFs = [en, fr]
    const modelRepo = makeModelRepoMock(modelsOnFs)
    const modelsInEngine = [en]
    const engine = makeEngineMock(modelsInEngine)

    // act
    const predictionHandler = new ScopedPredictionHandler(
      { defaultLanguage },
      engine,
      modelRepo,
      modelIdService,
      makeModelsByLang(modelsInEngine),
      stubLogger
    )
    const result = await predictionHandler.predict(germanUtt, anticipatedLang)

    // assert
    expect(result).toBeDefined()
    expect(result.language).toBe(fr)
    expect(result.detectedLanguage).toBe(de)

    assertPredictCalled(engine.predict as jest.Mock, [fr])
    assertModelLoaded(modelRepo.getLatestModel as jest.Mock, [de, fr])
  })

  test('predict with no model for both detected and anticipated langs should fallback on default', async () => {
    // arrange
    const modelsOnFs = [en]
    const modelRepo = makeModelRepoMock(modelsOnFs)
    const modelsInEngine = [en]
    const engine = makeEngineMock(modelsInEngine)

    // act
    const predictionHandler = new ScopedPredictionHandler(
      { defaultLanguage },
      engine,
      modelRepo,
      modelIdService,
      makeModelsByLang(modelsInEngine),
      stubLogger
    )
    const result = await predictionHandler.predict(germanUtt, anticipatedLang)

    // assert
    expect(result).toBeDefined()
    expect(result.language).toBe(en)
    expect(result.detectedLanguage).toBe(de)

    assertPredictCalled(engine.predict as jest.Mock, [en])
    assertModelLoaded(modelRepo.getLatestModel as jest.Mock, [de, fr])
  })

  test('predict with no model for both detected and anticipated langs and unloaded default should load default', async () => {
    // arrange
    const modelsOnFs = [en]
    const modelRepo = makeModelRepoMock(modelsOnFs)
    const modelsInEngine = []
    const engine = makeEngineMock(modelsInEngine)

    // act
    const predictionHandler = new ScopedPredictionHandler(
      { defaultLanguage },
      engine,
      modelRepo,
      modelIdService,
      makeModelsByLang(modelsInEngine),
      stubLogger
    )
    const result = await predictionHandler.predict(germanUtt, anticipatedLang)

    // assert
    expect(result).toBeDefined()
    expect(result.language).toBe(en)
    expect(result.detectedLanguage).toBe(de)

    assertPredictCalled(engine.predict as jest.Mock, [en])
    assertModelLoaded(modelRepo.getLatestModel as jest.Mock, [de, fr, en])
  })

  test('predict with no model for detected, anticipated and default should throw', async () => {
    // arrange
    const modelsOnFs = []
    const modelRepo = makeModelRepoMock(modelsOnFs)
    const modelsInEngine = []
    const engine = makeEngineMock(modelsInEngine)

    // act & assert
    const predictionHandler = new ScopedPredictionHandler(
      { defaultLanguage },
      engine,
      modelRepo,
      modelIdService,
      makeModelsByLang(modelsInEngine),
      stubLogger
    )
    await expect(predictionHandler.predict(germanUtt, anticipatedLang)).rejects.toThrowError()
    assertPredictCalled(engine.predict as jest.Mock, [])
    assertModelLoaded(modelRepo.getLatestModel as jest.Mock, [de, fr, en])
  })
})
