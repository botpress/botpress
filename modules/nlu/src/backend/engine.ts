import retry from 'bluebird-retry'
import * as sdk from 'botpress/sdk'
import crypto from 'crypto'
import fs from 'fs'

import { Config } from '../config'

import { DucklingEntityExtractor } from './pipelines/entities/duckling_extractor'
import FastTextClassifier from './pipelines/intents/ft_classifier'
import { FastTextIndentifier } from './pipelines/language/ft_lid'
import Storage from './storage'

export default class ScopedEngine {
  public readonly storage: Storage
  public minConfidence: number
  public maxConfidence: number

  private readonly intentClassifier: FastTextClassifier
  private readonly langDetector: LanguageIdentifier
  private readonly knownEntityExtractor: EntityExtractor

  private retryPolicy = {
    interval: 100,
    max_interval: 500,
    timeout: 5000,
    max_tries: 3
  }

  constructor(private logger: sdk.Logger, private botId: string, private readonly config: Config) {
    this.storage = new Storage(config, this.botId)
    this.intentClassifier = new FastTextClassifier(this.logger)
    this.langDetector = new FastTextIndentifier(this.logger)
    this.knownEntityExtractor = new DucklingEntityExtractor(this.logger)
  }

  async init(): Promise<void> {
    this.minConfidence = this.config.minimumConfidence
    this.maxConfidence = this.config.maximumConfidence

    if (isNaN(this.minConfidence) || this.minConfidence < 0 || this.minConfidence > 1) {
      this.minConfidence = 0
    }

    if (isNaN(this.maxConfidence) || this.maxConfidence < 0) {
      this.maxConfidence = 1
    }

    if (await this.checkSyncNeeded()) {
      await this.sync()
    }
  }

  public async sync(): Promise<void> {
    const intents = await this.storage.getIntents()
    const modelHash = this._getIntentsHash(intents)

    if (await this.storage.modelExists(modelHash)) {
      this.logger.debug(`Restoring intents model '${modelHash}' from storage`)
      const modelBuffer = await this.storage.getModelAsBuffer(modelHash)
      await this.intentClassifier.loadModel(modelBuffer, modelHash)
      return
    } else {
      try {
        this.logger.debug('The intents model needs to be updated, training model ...')
        const modelPath = await this.intentClassifier.train(intents, modelHash)
        const modelBuffer = fs.readFileSync(modelPath)
        const modelName = `${Date.now()}__${modelHash}.bin`
        await this.storage.persistModel(modelBuffer, modelName)
        this.logger.debug('Intents done training')
      } catch (err) {
        return this.logger.attachError(err).error('Error training intents')
      }
    }
  }

  public async checkSyncNeeded(): Promise<boolean> {
    const intents = await this.storage.getIntents()

    if (intents.length) {
      const intentsHash = this._getIntentsHash(intents)
      return this.intentClassifier.currentModelId !== intentsHash
    }

    return false
  }

  private _getIntentsHash(intents) {
    return crypto
      .createHash('md5')
      .update(JSON.stringify(intents))
      .digest('hex')
  }

  public async extract(incomingEvent: sdk.IO.Event): Promise<Predictions.ExtractResult> {
    return retry(() => this._extract(incomingEvent), this.retryPolicy)
  }

  private async _extract(incomingEvent: sdk.IO.Event): Promise<Predictions.ExtractResult> {
    const text = incomingEvent.preview

    const lang = await this.langDetector.identify(text)
    const entities = await this.knownEntityExtractor.extract(text, lang)
    const intents = await this.intentClassifier.predict(text)

    return {
      language: lang,
      entities,
      intent: intents[0],
      intents: intents.map(p => ({ ...p, provider: 'native' }))
    }
  }
}
