import '../../../../src/bp/sdk/botpress.d'

// tslint:disable-next-line: ordered-imports
import { NLU, IO, Logger } from 'botpress/sdk'

import _ from 'lodash'
import { ModelProvider, PredictionHandler } from './prediction-handler'

const frenchUtt = 'DONNE MOI UNE BANANE'
const englishUtt = 'GIVE ME A BANANA'
const germanUtt = 'GIB MIR EINE BANANE'

const fr = 'fr'
const en = 'en'
const de = 'de'

const loggerMock = (<Partial<Logger>>{ warn: (msg: string) => {} }) as Logger

const makeModelsByLang = (langs: string[]) => _.zipObject(langs, langs)

function makeEngineMock(loadedModels: string[]): NLU.Engine {
  return (<Partial<NLU.Engine>>{
    spellCheck: async (text: string, modelId: string) => text,

    loadModel: async (m: NLU.Model) => {
      loadedModels.push(m.languageCode)
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

    hasModel: (modelId: string) => loadedModels.includes(modelId),

    predict: jest.fn(async (textInput: string, ctx: string[], modelId: string) => {
      if (loadedModels.includes(modelId)) {
        return <IO.EventUnderstanding>{
          entities: [],
          predictions: {},
          includedContexts: ctx,
          language: modelId,
          ms: Date.now()
        }
      }
      return <IO.EventUnderstanding>{ errored: true }
    })
  }) as NLU.Engine
}

function makeModelProviderMock(modelsOnFs: string[]): ModelProvider {
  return {
    getLatestModel: jest.fn(async (languageCode: string) => {
      if (modelsOnFs.includes(languageCode)) {
        return <NLU.Model>{
          startedAt: new Date(),
          finishedAt: new Date(),
          hash: languageCode,
          languageCode,
          data: {
            input: '',
            output: ''
          }
        }
      }
    })
  }
}

const assertNoModelLoaded = (modelGetterMock: jest.Mock) => {
  assertModelLoaded(modelGetterMock, [])
}

const assertModelLoaded = (modelGetterMock: jest.Mock, langs: string[]) => {
  expect(modelGetterMock.mock.calls.length).toBe(langs.length)
  for (let i = 0; i < langs.length; i++) {
    expect(modelGetterMock.mock.calls[i][0]).toBe(langs[i])
  }
}

const assertPredictCalled = (enginePredictMock: jest.Mock, langs: string[]) => {
  expect(enginePredictMock.mock.calls.length).toBe(langs.length)
  for (let i = 0; i < langs.length; i++) {
    expect(enginePredictMock.mock.calls[i][2]).toBe(langs[i])
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
      engine,
      anticipatedLang,
      defaultLang,
      loggerMock
    )
    const result = await predictionHandler.predict(germanUtt, ['global'])

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
      engine,
      anticipatedLang,
      defaultLang,
      loggerMock
    )
    const result = await predictionHandler.predict(germanUtt, ['global'])

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
      engine,
      anticipatedLang,
      defaultLang,
      loggerMock
    )
    const result = await predictionHandler.predict(germanUtt, ['global'])

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
      engine,
      anticipatedLang,
      defaultLang,
      loggerMock
    )
    const result = await predictionHandler.predict(germanUtt, ['global'])

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
      engine,
      anticipatedLang,
      defaultLang,
      loggerMock
    )
    const result = await predictionHandler.predict(germanUtt, ['global'])

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
      engine,
      anticipatedLang,
      defaultLang,
      loggerMock
    )
    const result = await predictionHandler.predict(germanUtt, ['global'])

    // assert
    expect(result).toBeDefined()
    expect(result.language).toBe(en)
    expect(result.detectedLanguage).toBe(de)

    assertPredictCalled(engine.predict as jest.Mock, [en])
    assertModelLoaded(modelProvider.getLatestModel as jest.Mock, [de, fr, en])
  })

  test('predict with no model for detected, anticipated and default shoud throw', async () => {
    // arrange
    const modelsOnFs = []
    const modelProvider = makeModelProviderMock(modelsOnFs)
    const modelsInEngine = []
    const engine = makeEngineMock(modelsInEngine)

    // act & assert
    const predictionHandler = new PredictionHandler(
      makeModelsByLang(modelsInEngine),
      modelProvider,
      engine,
      anticipatedLang,
      defaultLang,
      loggerMock
    )
    await assertThrows(() => predictionHandler.predict(germanUtt, ['global']))
    assertPredictCalled(engine.predict as jest.Mock, [])
    assertModelLoaded(modelProvider.getLatestModel as jest.Mock, [de, fr, en])
  })
})
