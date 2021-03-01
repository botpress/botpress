import '../../../../src/bp/sdk/botpress.d'
import '../../../../src/bp/sdk/nlu.d'

import { Logger } from 'botpress/sdk'
import * as NLU from 'botpress/nlu'

import _ from 'lodash'
import ModelService from './model-service'
import { PredictionHandler } from './prediction-handler'

const frenchUtt = 'DONNE MOI UNE BANANE'
const englishUtt = 'GIVE ME A BANANA'
const germanUtt = 'GIB MIR EINE BANANE'

const fr = 'fr'
const en = 'en'
const de = 'de'

const loggerMock = (<Partial<Logger>>{
  attachError: (err: Error) => {
    return loggerMock
  },
  warn: (msg: string) => {},
  error: (msg: string) => {}
}) as Logger

const makeModelsByLang = (langs: string[]) => {
  const models: NLU.ModelId[] = (<Partial<NLU.ModelId>[]>langs.map(l => ({ languageCode: l }))) as NLU.ModelId[]
  return _.zipObject(langs, models)
}

function makeEngineMock(loadedLanguages: string[]): NLU.Engine {
  const loadedModels: NLU.ModelId[] = (<Partial<NLU.ModelId>[]>(
    loadedLanguages.map(l => ({ languageCode: l }))
  )) as NLU.ModelId[]

  return (<Partial<NLU.Engine>>{
    spellCheck: async (text: string, modelId: NLU.ModelId) => text,

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

    loadModel: async (m: NLU.Model) => {
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

    hasModel: (modelId: NLU.ModelId) => loadedModels.map(m => m.languageCode).includes(modelId.languageCode),

    predict: jest.fn(async (textInput: string, modelId: NLU.ModelId) => {
      if (loadedModels.map(m => m.languageCode).includes(modelId.languageCode)) {
        return <NLU.PredictOutput>{
          entities: [],
          predictions: {}
        }
      }
      throw new Error('model not loaded')
    })
  }) as NLU.Engine
}

function makeModelProviderMock(langsOnFs: string[]): ModelService {
  const getModel = async (modelId: { languageCode: string }) => {
    const { languageCode } = modelId
    if (langsOnFs.includes(languageCode)) {
      return <NLU.Model>{
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
  return (<Partial<ModelService>>{
    getLatestModel: jest.fn(getModel),
    getModel: jest.fn(getModel)
  }) as ModelService
}

const modelIdService = (<Partial<typeof NLU.modelIdService>>{
  toId: (m: NLU.ModelId) => m,
  briefId: (q: { specifications: any; languageCode: string }) => ({
    languageCode: q.languageCode
  })
}) as typeof NLU.modelIdService

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

const assertThrows = async (fn: () => Promise<any>) => {
  let errorThrown = false
  try {
    await fn()
  } catch {
    errorThrown = true
  }
  expect(errorThrown).toBe(true)
}

const defaultLang = en
const anticipatedLang = fr

describe('predict', () => {
  test('predict with loaded detected language should use detected', async () => {
    // arrange
    const modelsOnFs = [en, fr, de]
    const modelProvider = makeModelProviderMock(modelsOnFs)
    const modelsInEngine = [en, fr, de]
    const engine = makeEngineMock(modelsInEngine)

    // act
    const predictionHandler = new PredictionHandler(
      makeModelsByLang(modelsInEngine),
      modelProvider,
      modelIdService,
      engine,
      anticipatedLang,
      defaultLang,
      loggerMock
    )
    const result = await predictionHandler.predict(germanUtt)

    // assert
    expect(result).toBeDefined()
    expect(result.language).toBe(de)
    expect(result.detectedLanguage).toBe(de)

    assertPredictCalled(engine.predict as jest.Mock, [de])
    assertNoModelLoaded(modelProvider.getLatestModel as jest.Mock)
  })

  test('predict with unloaded detected language should load then predict', async () => {
    // arrange
    const modelsOnFs = [en, fr, de]
    const modelProvider = makeModelProviderMock(modelsOnFs)
    const modelsInEngine = [en, fr]
    const engine = makeEngineMock(modelsInEngine)

    // act
    const predictionHandler = new PredictionHandler(
      makeModelsByLang(modelsInEngine),
      modelProvider,
      modelIdService,
      engine,
      anticipatedLang,
      defaultLang,
      loggerMock
    )
    const result = await predictionHandler.predict(germanUtt)

    // assert
    expect(result).toBeDefined()
    expect(result.language).toBe(de)
    expect(result.detectedLanguage).toBe(de)

    assertPredictCalled(engine.predict as jest.Mock, [de])
    assertModelLoaded(modelProvider.getLatestModel as jest.Mock, [de])
  })

  test('predict with no model for detected language should fallback on anticipated', async () => {
    // arrange
    const modelsOnFs = [en, fr]
    const modelProvider = makeModelProviderMock(modelsOnFs)
    const modelsInEngine = [en, fr]
    const engine = makeEngineMock(modelsInEngine)

    // act
    const predictionHandler = new PredictionHandler(
      makeModelsByLang(modelsInEngine),
      modelProvider,
      modelIdService,
      engine,
      anticipatedLang,
      defaultLang,
      loggerMock
    )
    const result = await predictionHandler.predict(germanUtt)

    // assert
    expect(result).toBeDefined()
    expect(result.language).toBe(fr)
    expect(result.detectedLanguage).toBe(de)

    assertPredictCalled(engine.predict as jest.Mock, [fr])
    assertModelLoaded(modelProvider.getLatestModel as jest.Mock, [de])
  })

  test('predict with no model for detected lang and unloaded anticipated lang should load anticipated', async () => {
    // arrange
    const modelsOnFs = [en, fr]
    const modelProvider = makeModelProviderMock(modelsOnFs)
    const modelsInEngine = [en]
    const engine = makeEngineMock(modelsInEngine)

    // act
    const predictionHandler = new PredictionHandler(
      makeModelsByLang(modelsInEngine),
      modelProvider,
      modelIdService,
      engine,
      anticipatedLang,
      defaultLang,
      loggerMock
    )
    const result = await predictionHandler.predict(germanUtt)

    // assert
    expect(result).toBeDefined()
    expect(result.language).toBe(fr)
    expect(result.detectedLanguage).toBe(de)

    assertPredictCalled(engine.predict as jest.Mock, [fr])
    assertModelLoaded(modelProvider.getLatestModel as jest.Mock, [de, fr])
  })

  test('predict with no model for both detected and anticipated langs should fallback on default', async () => {
    // arrange
    const modelsOnFs = [en]
    const modelProvider = makeModelProviderMock(modelsOnFs)
    const modelsInEngine = [en]
    const engine = makeEngineMock(modelsInEngine)

    // act
    const predictionHandler = new PredictionHandler(
      makeModelsByLang(modelsInEngine),
      modelProvider,
      modelIdService,
      engine,
      anticipatedLang,
      defaultLang,
      loggerMock
    )
    const result = await predictionHandler.predict(germanUtt)

    // assert
    expect(result).toBeDefined()
    expect(result.language).toBe(en)
    expect(result.detectedLanguage).toBe(de)

    assertPredictCalled(engine.predict as jest.Mock, [en])
    assertModelLoaded(modelProvider.getLatestModel as jest.Mock, [de, fr])
  })

  test('predict with no model for both detected and anticipated langs and unloaded default should load default', async () => {
    // arrange
    const modelsOnFs = [en]
    const modelProvider = makeModelProviderMock(modelsOnFs)
    const modelsInEngine = []
    const engine = makeEngineMock(modelsInEngine)

    // act
    const predictionHandler = new PredictionHandler(
      makeModelsByLang(modelsInEngine),
      modelProvider,
      modelIdService,
      engine,
      anticipatedLang,
      defaultLang,
      loggerMock
    )
    const result = await predictionHandler.predict(germanUtt)

    // assert
    expect(result).toBeDefined()
    expect(result.language).toBe(en)
    expect(result.detectedLanguage).toBe(de)

    assertPredictCalled(engine.predict as jest.Mock, [en])
    assertModelLoaded(modelProvider.getLatestModel as jest.Mock, [de, fr, en])
  })

  test('predict with no model for detected, anticipated and default should throw', async () => {
    // arrange
    const modelsOnFs = []
    const modelProvider = makeModelProviderMock(modelsOnFs)
    const modelsInEngine = []
    const engine = makeEngineMock(modelsInEngine)

    // act & assert
    const predictionHandler = new PredictionHandler(
      makeModelsByLang(modelsInEngine),
      modelProvider,
      modelIdService,
      engine,
      anticipatedLang,
      defaultLang,
      loggerMock
    )
    await assertThrows(() => predictionHandler.predict(germanUtt))
    assertPredictCalled(engine.predict as jest.Mock, [])
    assertModelLoaded(modelProvider.getLatestModel as jest.Mock, [de, fr, en])
  })
})
