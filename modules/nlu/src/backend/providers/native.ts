import sdk from 'botpress/sdk'
import crypto from 'crypto'
import fs from 'fs'
import { find } from 'lodash'

import FastTextClassifier from '../fasttext/classifier'

import Provider from './base'

export default class ReNativeProvider extends Provider {
  private languageDetector: any // TODO Implement me :-(
  private intentClassifier: FastTextClassifier

  constructor(config) {
    super({ ...config, name: 'native', entityKey: '@native' })
    this.intentClassifier = new FastTextClassifier()
  }

  public async sync() {
    const intents = await this.storage.getIntents()
    const modelHash = this.getIntentsHash(intents)

    if (!(await this.checkTrainingNeeded(modelHash))) {
      this.logger.debug(`[Native] Restoring model '${modelHash}' from storage`)
      const model = await this.storage.loadModel(modelHash)
      await this.intentClassifier.loadModel(model, modelHash)
      this.logger.debug('[Native] Model is up to date')
      return
    }

    try {
      this.logger.debug('[Native] The model needs to be updated, training model')
      const modelPath = await this.intentClassifier.train(intents)
      const modelBuffer = fs.readFileSync(modelPath)
      const modelName = `${Date.now()}__${modelHash}.bin`
      await this.storage.persistModel(modelBuffer, modelName)
    } catch (err) {
      return this.logger.attachError(err).error('[Native] Error training model')
    }
  }

  public async checkSyncNeeded() {
    const intents = await this.storage.getIntents()
    const intentsHash = this.getIntentsHash(intents)
    return this.intentClassifier.currentModelId !== intentsHash
  }

  private getIntentsHash(intents) {
    return crypto
      .createHash('md5')
      .update(JSON.stringify(intents))
      .digest('hex')
  }

  /**
   * The goal of this method is to figure out if we need to
   * retrain a model from scratch or if we already have a pre-trained
   * model saved we can re-use
   */
  private async checkTrainingNeeded(currentIntentsHash: string) {
    const models = await this.storage.getAvailableModels()
    return !!find(models, m => m.hash === currentIntentsHash)
  }

  async extract(incomingEvent: sdk.IO.Event) {
    if (await this.checkSyncNeeded()) {
      await this.sync()
    }

    const predictions = this.intentClassifier.predict(incomingEvent.preview)

    // TODO Add language detection result here
    return {
      intent: predictions[0],
      intents: predictions.map(p => ({ ...p, provider: 'native' })),
      entities: []
    }
  }

  async getCustomEntities(): Promise<any> {
    // Native NLU doesn't support entity extraction (yet)
    return []
  }
}
