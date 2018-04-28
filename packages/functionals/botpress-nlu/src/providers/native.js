import _ from 'lodash'
import crypto from 'crypto'

import natural from 'natural'

import Provider from './base'
import Entities from './entities'

const NATIVE_HASH_KVS_KEY = 'nlu/native/updateMetadata'
const NATIVE_MODEL = 'nlu/native/model'

export default class NativeProvider extends Provider {
  constructor(config) {
    super({ ...config, name: 'native', entityKey: '@native' })
    this.classifier = null
  }

  async init() {}

  async checkSyncNeeded() {
    const intents = await this.storage.getIntents()
    return !await this._isInSync(intents)
  }

  _getProjectName() {
    const scope = 'all'
    return `${this.env}__${this.project}__${scope}`
  }

  async _isInSync(localIntents) {
    const intentsHash = crypto
      .createHash('md5')
      .update(JSON.stringify(localIntents))
      .digest('hex')

    const metadata = await this.kvs.get(NATIVE_HASH_KVS_KEY)
    return metadata && metadata.hash === intentsHash
  }

  async _onSyncSuccess(localIntents) {
    const intentsHash = crypto
      .createHash('md5')
      .update(JSON.stringify(localIntents))
      .digest('hex')

    // We save the model hash and model to the KVS
    await this.kvs.set(NATIVE_HASH_KVS_KEY, { hash: intentsHash })
    await this.kvs.set(NATIVE_MODEL, JSON.stringify(this.classifier))
  }

  async _restoreModel() {
    const model = await this.kvs.get(NATIVE_MODEL)

    if (!model) {
      this.classifier = new natural.BayesClassifier()
    }

    this.classifier = natural.BayesClassifier.restore(JSON.parse(model))
  }

  async getCustomEntities() {
    // Native NLU doesn't support entity extraction
    return []
  }

  async sync() {
    let intents = await this.storage.getIntents()

    if (await this._isInSync(intents)) {
      this.logger.debug('[NLU::Native] Model is up to date')
      return
    } else {
      this.logger.debug('[NLU::Native] The model needs to be updated')
    }

    const classifier = new natural.BayesClassifier()

    let samples_count = 0

    intents.forEach(intent => {
      intent.utterances.forEach(utterance => {
        const extracted = this.parser.extractLabelsFromCanonical(utterance, intent.entities)
        samples_count += 1
        classifier.addDocument(extracted.text, intent.name)
      })
    })

    this.logger.debug(`[NLU::Native] Started training model from ${samples_count} samples`)

    try {
      classifier.train()
    } catch (err) {
      return this.logger.error(`[NLU::Native] Error training model: ${err.message}`)
    }

    this.classifier = classifier

    await this._onSyncSuccess(intents)

    this.logger.info(`[NLU::Native] Synced model`)
  }

  async extract(incomingEvent) {
    if (!this.classifier) {
      if (await this.checkSyncNeeded()) {
        await this.sync()
      } else {
        await this._restoreModel()
      }
    }

    const classifications = this.classifier.getClassifications(incomingEvent.text)
    const intents = _.map(_.orderBy(classifications, ['value'], ['desc']), c => ({
      intent: c.label,
      score: c.value
    }))

    const bestIntent = _.first(intents)

    const intentName = _.get(bestIntent, 'intent') || 'None'
    const confidence = _.get(bestIntent, 'score') || 0

    return {
      intent: {
        name: intentName,
        confidence: parseFloat(confidence),
        provider: 'native'
      },
      intents: intents.map(intent => ({
        name: intent.intent,
        confidence: parseFloat(intent.score),
        provider: 'native'
      })),
      entities: [] // Unsupported for now
    }
  }
}
