import * as sdk from 'botpress/sdk'
import { readFileSync, writeFileSync } from 'fs'
import _ from 'lodash'
import { Predictors } from 'nlu-core/predict-pipeline'
import { Tools } from 'nlu-core/typings'
import path from 'path'
import tmp from 'tmp'

const PRETRAINED_LID_176 = path.join(process.APP_DATA_PATH, './pre-trained/lid.176.ftz')
const NA_LANG = 'n/a'

class FastTextLanguageId {
  private static model: sdk.MLToolkit.FastText.Model
  private static toolkit: typeof sdk.MLToolkit

  constructor(toolkit: typeof sdk.MLToolkit) {
    FastTextLanguageId.toolkit = toolkit
  }

  protected static async initializeModel() {
    const tmpFn = tmp.tmpNameSync({ postfix: '.ftz' })
    const modelBuff = readFileSync(PRETRAINED_LID_176)
    writeFileSync(tmpFn, modelBuff)
    const ft = new FastTextLanguageId.toolkit.FastText.Model()
    await ft.loadFromFile(tmpFn)
    FastTextLanguageId.model = ft
  }

  async identify(text: string): Promise<sdk.MLToolkit.FastText.PredictResult[]> {
    if (!FastTextLanguageId.model) {
      await FastTextLanguageId.initializeModel()
    }

    if (!FastTextLanguageId.model) {
      return []
    }

    return (await FastTextLanguageId.model.predict(text, 3))
      .map(pred => ({
        ...pred,
        label: pred.label.replace('__label__', '')
      }))
      .sort((predA, predB) => predB.value - predA.value) // descending
  }
}

let langIdentifier: FastTextLanguageId
export default async function(
  sentence: string,
  predictorsByLang: _.Dictionary<Predictors>,
  tools: Tools
): Promise<string> {
  const supportedLanguages = Object.keys(predictorsByLang)

  if (!langIdentifier) {
    langIdentifier = new FastTextLanguageId(tools.mlToolkit)
  }

  const bestMlLangMatch = (await langIdentifier.identify(sentence))[0]
  let detectedLanguage = bestMlLangMatch?.label ?? NA_LANG
  let scoreDetectedLang = bestMlLangMatch?.value ?? 0

  // because with single-worded sentences, confidence is always very low
  // we assume that a input of 20 chars is more than a single word
  const threshold = sentence.length > 20 ? 0.5 : 0.3

  // if ML-based language identifier didn't find a match
  // we proceed with a custom vocabulary matching algorithm
  // ie. the % of the sentence comprised of tokens in the training vocabulary
  if (scoreDetectedLang <= threshold) {
    try {
      const match = _.chain(supportedLanguages)
        .map(lang => ({
          lang,
          sentence: sentence.toLowerCase(),
          tokens: _.orderBy(Object.keys(predictorsByLang[lang].vocabVectors), 'length', 'desc')
        }))
        .map(({ lang, sentence, tokens }) => {
          for (const token of tokens) {
            sentence = sentence.replace(token, '')
          }
          return { lang, confidence: 1 - sentence.length / sentence.length }
        })
        .filter(x => x.confidence >= threshold)
        .orderBy('confidence', 'desc')
        .first()
        .value()

      if (match) {
        detectedLanguage = match.lang
        scoreDetectedLang = match.confidence
      }
    } finally {
    }
  }

  return detectedLanguage
}
