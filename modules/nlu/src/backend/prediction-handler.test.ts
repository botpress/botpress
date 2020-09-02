import '../../../../src/bp/sdk/botpress.d'

// tslint:disable-next-line: ordered-imports
import { NLU, IO } from 'botpress/sdk'

import _ from 'lodash'
import { PredictionHandler } from './prediction-handler'

const frenchUtt = 'DONNE MOI UNE BANANE'
const englishUtt = 'GIVE ME A BANANA'
const germanUtt = 'GIB MIR EINE BANANE'

const fr = 'fr'
const en = 'en'
const de = 'de'

function makeEngineMock(loadedModels: string[]): NLU.Engine {
  return (<Partial<NLU.Engine>>{
    loadModel: jest.fn(async (m: NLU.Model) => {
      loadedModels.push(m.languageCode)
    }),

    predict: jest.fn(async (textInput: string, ctx: string[], language: string) => {
      let detectedLanguage = de
      if (textInput === frenchUtt) {
        detectedLanguage = fr
      } else if (textInput === englishUtt) {
        detectedLanguage = en
      }

      if (loadedModels.includes(language)) {
        return <IO.EventUnderstanding>{
          detectedLanguage,
          entities: [],
          predictions: {},
          includedContexts: ctx,
          language,
          ms: Date.now()
        }
      }
      return <IO.EventUnderstanding>{ error: 'invalid_predictor', detectedLanguage }
    })
  }) as NLU.Engine
}

function makeModelGetterMock(modelsOnFs: string[]): (languageCode: string) => Promise<NLU.Model | undefined> {
  return jest.fn(async (languageCode: string) => {
    if (modelsOnFs.includes(languageCode)) {
      return <NLU.Model>{
        startedAt: new Date(),
        finishedAt: new Date(),
        hash: 'heyheyhey ;)',
        languageCode,
        data: {
          input: '',
          output: ''
        }
      }
    }
  }) as (languageCode: string) => Promise<NLU.Model | undefined>
}

const assertNoModelLoaded = (engineLoadMock: jest.Mock, modelGetterMock: jest.Mock) => {
  assertNoModelLoadedFromFS(modelGetterMock)
  assertNoModelLoadedFromFS(engineLoadMock)
}

const assertNoModelLoadedFromFS = (modelGetterMock: jest.Mock) => {
  assertModelLoadedFromFS(modelGetterMock, [])
}

const assertNoModelLoadedInEngine = (engineLoadMock: jest.Mock) => {
  assertModelLoadedInEngine(engineLoadMock, [])
}

const assertModelLoadedFromFS = (modelGetterMock: jest.Mock, langs: string[]) => {
  expect(modelGetterMock.mock.calls.length).toBe(langs.length)

  for (let i = 0; i < langs.length; i++) {
    expect(modelGetterMock.mock.calls[i][0]).toBe(langs[i])
  }
}

const assertModelLoadedInEngine = (engineLoadMock: jest.Mock, langs: string[]) => {
  expect(engineLoadMock.mock.calls.length).toBe(langs.length)

  for (let i = 0; i < langs.length; i++) {
    expect(engineLoadMock.mock.calls[i][0].languageCode).toBe(langs[i])
  }
}

const assertPredictCalled = (enginePredictMock: jest.Mock, langs: string[]) => {
  expect(enginePredictMock.mock.calls.length).toBe(langs.length)

  for (let i = 0; i < langs.length; i++) {
    expect(enginePredictMock.mock.calls[i][2]).toBe(langs[i])
  }
}

describe('predict', () => {
  test('predict with default == detected language should predict once', async () => {
    // arrange
    const modelsOnFs = [en, fr]
    const modelGetter = makeModelGetterMock(modelsOnFs) as jest.Mock
    const modelsInEngine = [en]
    const engine = makeEngineMock(modelsInEngine)

    // act
    const defaultLang = en
    const predictionHandler = new PredictionHandler(modelGetter, engine, defaultLang)
    const result = await predictionHandler.predict(englishUtt, ['global'])

    // assert
    expect(result).toBeDefined()
    expect(result.language).toBe(en)
    expect(result.detectedLanguage).toBe(en)

    assertPredictCalled(engine.predict as jest.Mock, [en])
    assertNoModelLoaded(engine.loadModel as jest.Mock, modelGetter)
  })

  test('predict with default != detected language should predict twice', async () => {
    // arrange
    const modelsOnFs = [en, fr]
    const modelGetter = makeModelGetterMock(modelsOnFs) as jest.Mock
    const modelsInEngine = [en, fr]
    const engine = makeEngineMock(modelsInEngine)

    // act
    const defaultLang = en
    const predictionHandler = new PredictionHandler(modelGetter, engine, defaultLang)
    const result = await predictionHandler.predict(frenchUtt, ['global'])

    // assert
    expect(result).toBeDefined()
    expect(result.language).toBe(fr)
    expect(result.detectedLanguage).toBe(fr)

    assertPredictCalled(engine.predict as jest.Mock, [en, fr])
    assertNoModelLoaded(engine.loadModel as jest.Mock, modelGetter)
  })

  test('predict with default == detected but default not loaded should predict then load then predict', async () => {
    // arrange
    const modelsOnFs = [en, fr]
    const modelGetter = makeModelGetterMock(modelsOnFs) as jest.Mock
    const modelsInEngine = []
    const engine = makeEngineMock(modelsInEngine)

    // act
    const defaultLang = en
    const predictionHandler = new PredictionHandler(modelGetter, engine, defaultLang)
    const result = await predictionHandler.predict(englishUtt, ['global'])

    // assert
    expect(result).toBeDefined()
    expect(result.language).toBe(en)
    expect(result.detectedLanguage).toBe(en)

    assertPredictCalled(engine.predict as jest.Mock, [en, en])
    assertModelLoadedFromFS(modelGetter, [en])
    assertModelLoadedInEngine(engine.loadModel as jest.Mock, [en])
  })

  test('predict with default != detected and default not loaded shoud not try to load default', async () => {
    // arrange
    const modelsOnFs = [en, fr]
    const modelGetter = makeModelGetterMock(modelsOnFs) as jest.Mock
    const modelsInEngine = [fr]
    const engine = makeEngineMock(modelsInEngine)

    // act
    const defaultLang = en
    const predictionHandler = new PredictionHandler(modelGetter, engine, defaultLang)
    const result = await predictionHandler.predict(frenchUtt, ['global'])

    // assert
    expect(result).toBeDefined()
    expect(result.language).toBe(fr)
    expect(result.detectedLanguage).toBe(fr)

    assertPredictCalled(engine.predict as jest.Mock, [en, fr])
    assertNoModelLoaded(engine.loadModel as jest.Mock, modelGetter)
  })

  test('predict with default != detected and detected not loaded should predict twice then load then predict', async () => {
    // arrange
    const modelsOnFs = [en, fr]
    const modelGetter = makeModelGetterMock(modelsOnFs) as jest.Mock
    const modelsInEngine = [en]
    const engine = makeEngineMock(modelsInEngine)

    // act
    const defaultLang = en
    const predictionHandler = new PredictionHandler(modelGetter, engine, defaultLang)
    const result = await predictionHandler.predict(frenchUtt, ['global'])

    // assert
    expect(result).toBeDefined()
    expect(result.language).toBe(fr)
    expect(result.detectedLanguage).toBe(fr)

    assertPredictCalled(engine.predict as jest.Mock, [en, fr, fr])
    assertModelLoadedFromFS(modelGetter, [fr])
    assertModelLoadedInEngine(engine.loadModel as jest.Mock, [fr])
  })

  test('predict with default != detected but no model for detected in FS should return default', async () => {
    // arrange
    const modelsOnFs = [en, fr]
    const modelGetter = makeModelGetterMock(modelsOnFs) as jest.Mock
    const modelsInEngine = [en]
    const engine = makeEngineMock(modelsInEngine)

    // act
    const defaultLang = en
    const predictionHandler = new PredictionHandler(modelGetter, engine, defaultLang)
    const result = await predictionHandler.predict(germanUtt, ['global'])

    // assert
    expect(result).toBeDefined()
    expect(result.language).toBe(en)
    expect(result.detectedLanguage).toBe(de)

    assertPredictCalled(engine.predict as jest.Mock, [en, de])
    assertModelLoadedFromFS(modelGetter, [de])
    assertNoModelLoadedInEngine(engine.loadModel as jest.Mock)
  })

  test('predict with default != detected but no model for detected in FS and default not loaded should try to load default', async () => {
    // arrange
    const modelsOnFs = [en, fr]
    const modelGetter = makeModelGetterMock(modelsOnFs) as jest.Mock
    const modelsInEngine = []
    const engine = makeEngineMock(modelsInEngine)

    // act
    const defaultLang = en
    const predictionHandler = new PredictionHandler(modelGetter, engine, defaultLang)
    const result = await predictionHandler.predict(germanUtt, ['global'])

    // assert
    expect(result).toBeDefined()
    expect(result.language).toBe(en)
    expect(result.detectedLanguage).toBe(de)

    assertPredictCalled(engine.predict as jest.Mock, [en, de, en])
    assertModelLoadedFromFS(modelGetter, [de, en])
    assertModelLoadedInEngine(engine.loadModel as jest.Mock, [en])
  })

  test('predict with default == detected but no model for lang in FS should throw', async () => {
    // arrange
    const modelsOnFs = [en, fr]
    const modelGetter = makeModelGetterMock(modelsOnFs) as jest.Mock
    const modelsInEngine = []
    const engine = makeEngineMock(modelsInEngine)

    // act
    const defaultLang = de
    const predictionHandler = new PredictionHandler(modelGetter, engine, defaultLang)

    let errorOccured = false
    try {
      await predictionHandler.predict(germanUtt, ['global'])
    } catch {
      errorOccured = true
    }

    // assert
    expect(errorOccured).toBe(true)
    assertPredictCalled(engine.predict as jest.Mock, [de])
    assertModelLoadedFromFS(modelGetter, [de])
    assertNoModelLoadedInEngine(engine.loadModel as jest.Mock)
  })
})
