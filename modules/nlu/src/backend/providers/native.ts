import crypto from 'crypto'
import { join } from 'path'

import FastTextClassifier from '../fasttext/FastTextClassifier'

import Provider from './base'

const NATIVE_HASH_KVS_KEY = 'nlu/native/updateMetadata'

export default class ReNativeProvider extends Provider {
  private languageDetector: any
  private intentClassifier: FastTextClassifier

  constructor(config) {
    super({ ...config, name: 'native', entityKey: '@native' })

    const modelDir = join(__dirname, '../nativeModels')
    this.intentClassifier = new FastTextClassifier(modelDir)
    // TODO implement languagedetector provider
  }

  private async isInSync(localIntents) {
    const intentsHash = crypto
      .createHash('md5')
      .update(JSON.stringify(localIntents))
      .digest('hex')

    const metadata = await this.kvs.get(this.botId, NATIVE_HASH_KVS_KEY)
    return metadata && metadata.hash === intentsHash
  }

  private async onSyncSuccess(localIntents) {
    const intentsHash = crypto
      .createHash('md5')
      .update(JSON.stringify(localIntents))
      .digest('hex')

    // We save the model hash to the KVS
    await this.kvs.set(this.botId, NATIVE_HASH_KVS_KEY, { hash: intentsHash })
  }

  async sync() {
    const intents = await this.storage.getIntents()

    if (await this.isInSync(intents)) {
      this.logger.debug('[Native] Model is up to date')
      return
    } else {
      this.logger.debug('[Native] The model needs to be updated, training model')
    }

    try {
      this.intentClassifier.train(intents)
    } catch (err) {
      return this.logger.attachError(err).error('[Native] Error training model')
    }

    await this.onSyncSuccess(intents)
  }

  async checkSyncNeeded() {
    const intents = await this.storage.getIntents()
    return !(await this.isInSync(intents))
  }

  async extract(incomingText) {
    if (await this.checkSyncNeeded()) {
      await this.sync()
    }

    const predictions = this.intentClassifier.predict(incomingText)

    // TODO use language detector to detec langage
    return {
      intent: predictions[0],
      intents: predictions.map(p => ({ ...p, provider: 'native' })),
      entities: []
    }
  }

  async getCustomEntities(): Promise<any> {
    // Native NLU doesn't support entity extraction
    return []
  }
}
