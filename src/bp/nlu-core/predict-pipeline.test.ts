import Engine from './engine'
import { DetectLanguage, PredictInput, Predictors } from './predict-pipeline'
process.APP_DATA_PATH = '/home/pedro/botpress'
describe('Detect language', () => {
  // @ts-ignore
  const PREDICTORBYLANG = {
    en: {
      vocabVectors: {
        wagadougou: [],
        plipoulilo: [],
        scrapoulili: [],
        chachouchi: [],
        mwahahaha: [],
        oplikakou: [],
        rasharam: []
      }
    },
    fr: {
      vocabVectors: {
        acoucoutoi: [],
        mangarasa: [],
        boeboeou: [],
        chaqaxama: [],
        moulimoula: []
      }
    }
  } as _.Dictionary<Predictors>
  const BASEINPUT = { defaultLanguage: 'en', includedContexts: [], sentence: '' } as PredictInput

  test('Detect En', () => {
    expect(
      DetectLanguage(
        { ...BASEINPUT, sentence: "Hello, I'm here to test this little test" },
        PREDICTORBYLANG,
        Engine.tools
      )
    ).toEqual({
      usedLanguage: 'en',
      detectedLanguage: 'en'
    })
  })

  test('Detect Fr', () => {
    expect(
      DetectLanguage(
        { ...BASEINPUT, sentence: 'Bonjour je suis ici pour tester ce petit test' },
        PREDICTORBYLANG,
        Engine.tools
      )
    ).toEqual({
      usedLanguage: 'en',
      detectedLanguage: 'fr'
    })
  })

  test('Custom logic detect En', () => {
    expect(
      DetectLanguage(
        { ...BASEINPUT, sentence: 'wagadougu plipoulilo scrapoulili chachouchi mwahahaha oplikakou rasharam' },
        PREDICTORBYLANG,
        Engine.tools
      )
    ).toEqual({
      usedLanguage: 'en',
      detectedLanguage: 'en'
    })
  })

  test('Custom logic detect Fr', () => {
    expect(
      DetectLanguage(
        { ...BASEINPUT, sentence: ' acoucoutoi mangarasa boeboeou chaqaxama moulimoula ' },
        PREDICTORBYLANG,
        Engine.tools
      )
    ).toEqual({
      usedLanguage: 'en',
      detectedLanguage: 'fr'
    })
  })
})
