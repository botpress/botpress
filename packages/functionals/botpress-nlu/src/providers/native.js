import _ from 'lodash'
import crypto from 'crypto'

import zscore from 'zscore'
import natural from 'natural'

import Provider from './base'

const NATIVE_HASH_KVS_KEY = 'nlu/native/updateMetadata'
const NATIVE_MODEL = 'nlu/native/model'
const DEFAULT_THRESHOLD = 0.25
const EMPTY_INTENT = {
  name: 'None',
  confidence: 0,
  provider: 'native'
}

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

  setStemmer(stemmer) {
    if (!stemmer) {
      this.customStemmer = null
    } else if (!_.isFunction(stemmer)) {
      this.logger.error('[NLU::Native] Stemmer must be a function')
      this.customStemmer = null
    } else {
      this.customStemmer = stemmer
    }
  }

  getStemmer() {
    return { tokenizeAndStem: this._stemText.bind(this) }
  }

  _stemText(text) {
    if (this.customStemmer) {
      return this.customStemmer(text)
    } else {
      return natural.PorterStemmer.tokenizeAndStem(text)
    }
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

    this.classifier = natural.BayesClassifier.restore(JSON.parse(model), this.getStemmer())
  }

  async getCustomEntities() {
    // Native NLU doesn't support entity extraction
    return []
  }

  async sync() {
    const intents = await this.storage.getIntents()

    if (await this._isInSync(intents)) {
      this.logger.debug('[NLU::Native] Model is up to date')
      return
    } else {
      this.logger.debug('[NLU::Native] The model needs to be updated')
    }

    const classifier = new natural.BayesClassifier(this.getStemmer())

    let samples_count = 0

    intents.forEach(intent => {
      intent.utterances.forEach(utterance => {
        const extracted = this.parser.extractLabelsFromCanonical(utterance, intent.entities)
        samples_count += 1
        classifier.addDocument(this._stemText(extracted.text), intent.name)
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

    const threshold = parseFloat(this.nativeAdjustementThreshold || DEFAULT_THRESHOLD)

    const classifications = _.orderBy(this.classifier.getClassifications(incomingEvent.text), ['value'], ['desc'])

    let allScores = zscore(classifications.map(c => parseFloat(c.value)))

    allScores = allScores.map((s, i) => {
      const delta = Math.abs(s - allScores[i + 1] / s)
      if (delta >= threshold) {
        return s
      }

      return (
        s -
        Math.max(0, allScores[i + 1] || 0) * 0.5 -
        Math.max(0, allScores[i + 2] || 0) * 0.75 -
        Math.max(0, allScores[i + 3] || 0)
      )
    })

    const intents = _.orderBy(
      classifications.map((c, i) => ({
        name: c.label,
        confidence: allScores[i],
        provider: 'native'
      })),
      ['confidence'],
      'desc'
    )

    return {
      intent: intents.length ? intents[0] : { ...EMPTY_INTENT },
      intents,
      entities: [] // Unsupported for now
    }
  }
}
