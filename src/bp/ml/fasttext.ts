import { reject, resolve } from 'bluebird'
import * as sdk from 'botpress/sdk'
import { VError } from 'verror'

const binding = require('./fasttext.node')

const FAST_TEXT_VERBOSOSITY = parseInt(process.env.FAST_TEXT_VERBOSOSITY || '0')
const FAST_TEXT_CLEANUP_MS = parseInt(process.env.FAST_TEXT_CLEANUP_MS || '60000') // 60s caching by default

/** A wrapper class around the fasttext node bindings.
 * This wrapper adds support for lazy loading of the models, which
 * allows to delay the loading of the model only when actually needed for prediction or query.
 * It also cleans up the model after 'x' ms of inactivity to free up memory.
 */
export class FastTextModel implements sdk.MLToolkit.FastText.Model {
  private _modelPromise: Promise<any> | undefined
  private _queryPromise: Promise<any> | undefined
  private _modelTimeout: NodeJS.Timeout | undefined
  private _queryTimeout: NodeJS.Timeout | undefined
  private _modelPath: string | undefined

  private get modelPath(): string {
    if (!this._modelPath) {
      throw new Error('Model path not set')
    }

    if (this._modelPath.endsWith('.ftz') || this._modelPath.endsWith('.bin')) {
      return this._modelPath
    }

    return this._modelPath + '.bin'
  }

  constructor(private lazy: boolean = true, private keepInMemory = false) {}

  async trainToFile(
    method: sdk.MLToolkit.FastText.TrainCommand,
    modelPath: string,
    args: Partial<sdk.MLToolkit.FastText.TrainArgs>
  ): Promise<void> {
    const outPath = this._cleanPath(modelPath)
    const model = new binding.Classifier()
    await model.train(method, {
      ...args,
      output: outPath,
      verbose: FAST_TEXT_VERBOSOSITY
    })
    this._modelPath = outPath

    if (!this.lazy) {
      await this._getModel()
      await this._getQuery()
    }
  }

  async loadFromFile(modelPath: string): Promise<void> {
    this._modelPath = this._cleanPath(modelPath)
    if (!this.lazy) {
      await this._getModel()
      await this._getQuery()
    }
  }

  async predict(str: string, nbLabels: number): Promise<sdk.MLToolkit.FastText.PredictResult[]> {
    const model = await this._getModel()
    return model.predict(str, nbLabels)
  }

  async queryWordVectors(word: string): Promise<number[]> {
    const query = await this._getQuery()
    return query.getWordVector(word)
  }

  async queryNearestNeighbors(word: string, nb: number): Promise<string[]> {
    const query = await this._getQuery()
    const ret = await query.nn(word, nb)
    return ret.map(x => x.label)
  }

  private async _getModel(): Promise<any> {
    if (this._modelPromise && !this._modelPromise!.isRejected()) {
      this._resetModelBomb()
      return this._modelPromise
    }

    const model = new binding.Classifier()
    this._modelPromise = new Promise((resolve, reject) => {
      model
        .loadModel(this.modelPath)
        .then(() => {
          resolve(model)
          this._resetModelBomb()
        })
        .catch(err => reject(new VError(err, `Model = "${this.modelPath}"`)))
    })

    return this._modelPromise
  }

  private async _getQuery(): Promise<any> {
    if (this._queryPromise && !this._queryPromise!.isRejected()) {
      this._resetQueryBomb()
      return this._queryPromise
    }

    this._queryPromise = new Promise((resolve, reject) => {
      try {
        const q = new binding.Query(this.modelPath)
        resolve(q)
        this._resetQueryBomb()
      } catch (err) {
        reject(new VError(err, `Model = "${this.modelPath}"`))
      }
    })

    return this._queryPromise
  }

  private _resetModelBomb() {
    if (this.keepInMemory) {
      return
    }

    if (this._modelTimeout) {
      clearTimeout(this._modelTimeout)
    }

    this._modelTimeout = setTimeout(() => (this._modelPromise = undefined), FAST_TEXT_CLEANUP_MS)
  }

  private _resetQueryBomb() {
    if (this.keepInMemory) {
      return
    }

    if (this._queryTimeout) {
      clearTimeout(this._queryTimeout)
    }

    this._queryTimeout = setTimeout(() => (this._queryPromise = undefined), FAST_TEXT_CLEANUP_MS)
  }

  private _cleanPath(modelPath: string): string {
    return modelPath.replace(/\.bin$/i, '')
  }
}
