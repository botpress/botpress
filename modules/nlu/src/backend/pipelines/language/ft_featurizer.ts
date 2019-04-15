import * as sdk from 'botpress/sdk'
import fs from 'fs'
import _ from 'lodash'
import * as numjs from 'numjs'
import VError from 'verror'

const debug = DEBUG('nlu')
  .sub('intents')
  .sub('vocab')

type Token = string
type Document = Token[]

export default class FTWordVecFeaturizer {
  private static _pretrainedByLanguage: { [lang: string]: sdk.MLToolkit.FastText.Model } = {}
  private static _pretrainedLock: Promise<void> | undefined = undefined
  private static _toolkit: typeof sdk.MLToolkit
  private static _langModels: Map<string, string> = new Map<string, string>()

  static provideLanguage(lang: string, modelPath: string) {
    try {
      if (!fs.existsSync(modelPath)) {
        throw new Error(`Model '${lang}' at location '${modelPath}' does not exist`)
      }
    } catch (err) {
      throw new VError(`Could not find model '${lang}' at '${modelPath}'`, err)
    }

    this._langModels.set(lang, modelPath)
  }

  static setToolkit(toolkit: typeof sdk.MLToolkit) {
    this._toolkit = toolkit
  }

  static async hasLanguage(lang: string): Promise<boolean> {
    if (this._pretrainedByLanguage[lang]) {
      return true
    }

    if (this._pretrainedLock) {
      await this._pretrainedLock
    }

    return !!this._pretrainedByLanguage[lang]
  }

  static async loadLanguage(lang: string): Promise<void> {
    if (await this.hasLanguage(lang)) {
      return
    }

    if (!this._langModels.has(lang)) {
      throw new Error(`Can't load language "${lang}" because no model has been found`)
    }

    let doneFn: Function
    const modelPath = this._langModels.get(lang)

    if (this._pretrainedLock !== undefined) {
      // should never happen
      throw new Error('Failed to acquire lock')
    } else {
      this._pretrainedLock = new Promise(resolve => (doneFn = resolve))
    }

    try {
      const usedBefore = process.memoryUsage().rss / 1024 / 1024
      const dtBefore = Date.now()
      const model = new this._toolkit.FastText.Model(false, true, true)
      await model.loadFromFile(modelPath)
      this._pretrainedByLanguage[lang] = model
      const dtAfter = Date.now()
      const usedAfter = process.memoryUsage().rss / 1024 / 1024
      const usedDelta = Math.round(usedAfter - usedBefore)
      const dtDelta = dtAfter - dtBefore
      debug(`language model '${lang}' took about ${usedDelta}mb of RAM and ${dtDelta}ms to load`)
    } catch (err) {
      debug('error loading model', { modelPath, lang })
      throw new VError('Error loading pretrained ')
    } finally {
      doneFn && doneFn()
      this._pretrainedLock = undefined
    }
  }

  public static async getFeatures(lang: string, doc: Document, docTfidf: _.Dictionary<number>): Promise<number[]> {
    const defaultWordWeight = docTfidf['__avg__'] || 1

    if (!this._pretrainedByLanguage[lang]) {
      throw new Error(`Vocab: Model for lang '${lang}' is not loaded in memory`)
    }

    const vecs = await Promise.mapSeries(doc, token =>
      this._pretrainedByLanguage[lang].queryWordVectors(token.toLowerCase())
    )

    debug(`get for '${lang}'`, { doc, gotten: vecs.map(x => x.length) })

    if (!vecs.length) {
      throw new Error(`Could not get sentence vectors (empty result)`)
    }

    // Compute sentence vector
    // See https://github.com/facebookresearch/fastText/blob/26bcbfc6b288396bd189691768b8c29086c0dab7/src/fasttext.cc#L486s
    const sentenceVec = numjs.zeros(vecs[0].length)
    let totalWeight = 0
    vecs.forEach((arr, i) => {
      let sum = 0
      arr.forEach(x => (sum += x * x))
      const norm = Math.sqrt(sum)
      if (norm > 0) {
        const weight = docTfidf[doc[i]] || defaultWordWeight
        totalWeight += weight
        const arr2 = numjs.array(arr).divide(norm / weight)
        sentenceVec.add(arr2, false)
      }
    })

    sentenceVec.divide(totalWeight, false)
    return sentenceVec.tolist() as number[]
  }
}
