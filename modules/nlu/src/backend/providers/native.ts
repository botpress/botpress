import sdk from 'botpress/sdk'
import crypto from 'crypto'
import { readFileSync } from 'fs'

import FastTextClassifier from '../fasttext/classifier'

import Provider from './base'

export default class NativeProvider extends Provider {
  private languageDetector: any // TODO Implement me :-(
  private intentClassifier: FastTextClassifier

  constructor(config) {
    super({ ...config, name: 'native', entityKey: '@native' })
    this.intentClassifier = new FastTextClassifier()
  }

  async init() {
    if (await this.checkSyncNeeded()) {
      await this.sync()
    }
  }

  public async sync() {
    const intents = await this.storage.getIntents()
    const modelHash = this.getIntentsHash(intents)

    if (await this.storage.modelExists(modelHash)) {
      this.logger.debug(`[Native] Restoring model '${modelHash}' from storage`)
      const modelBuffer = await this.storage.getModelAsBuffer(modelHash)
      await this.intentClassifier.loadModel(modelBuffer, modelHash)
      return
    } else {
      this.logger.debug('[Native] The model needs to be updated, training model ...')
      try {
        // TODO return buffer instead of path ?
        const modelPath = await this.intentClassifier.train(intents, modelHash)
        const modelBuffer = readFileSync(modelPath)
        const modelName = `${Date.now()}__${modelHash}.bin`
        await this.storage.persistModel(modelBuffer, modelName)
        this.logger.debug('[Native] Done training model.')
      } catch (err) {
        return this.logger.attachError(err).error('[Native] Error training model')
      }
    }
  }

  public async checkSyncNeeded() {
    const intents = await this.storage.getIntents()
    if (intents.length) {
      const intentsHash = this.getIntentsHash(intents)
      return this.intentClassifier.currentModelId !== intentsHash
    } else return false
  }

  private getIntentsHash(intents) {
    return crypto
      .createHash('md5')
      .update(JSON.stringify(intents))
      .digest('hex')
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
