import _ from 'lodash'
import axios from 'axios'
import crypto from 'crypto'
import Promise from 'bluebird'

import Provider from './base'

const RECAST_HASH_KVS_KEY = 'nlu/recast/updateMetadata'

export default class RecastProvider extends Provider {
  constructor(config) {
    super({ ...config, name: 'recast', entityKey: '@recast' })

    this.endpoint = `/users/${this.config.recastUserSlug}/bots/${this.config.recastBotSlug}`

    this.client = axios.create({
      baseURL: 'https://api.recast.ai/v2',
      headers: { Authorization: `Token ${this.config.recastToken}` }
    })
  }

  _getBotModel() {
    return this.client.get(`${this.endpoint}`)
  }

  _getBulkCreations() {
    return this.client.get(`${this.endpoint}/bulk_creations`)
  }

  _getRemoteIntents() {
    return this.client.get(`${this.endpoint}/intents`)
  }

  _deleteIntent(intentSlug) {
    return this.client.delete(`${this.endpoint}/intents/${intentSlug}`)
  }

  _postIntent(intent) {
    return this.client.post(`${this.endpoint}/intents`, intent)
  }

  _getRemoteIntentExpressions(intentSlug) {
    return this.client.get(`${this.endpoint}/intents/${intentSlug}/expressions`)
  }

  _getRemoteExpression(intentSlug, expressionId) {
    return this.client.get(`${this.endpoint}/intents/${intentSlug}/expressions/${expressionId}`)
  }

  _updateRemoteExpression(intentSlug, expressionId, expression) {
    return this.client.put(`${this.endpoint}/intents/${intentSlug}/expressions/${expressionId}`, expression)
  }

  _getRemoteGazettes() {
    return this.client.get(`${this.endpoint}/gazettes`)
  }

  _deleteGazette(gazetteSlug) {
    return this.client.delete(`${this.endpoint}/gazettes/${gazetteSlug}`)
  }

  async _postGazette(entity) {
    try {
      await this.client.post(`/entities`, { name: entity.entity_id })
    } catch (err) {
      // Entities names on recast are shared, so it's not really an error
      if (err.response.data.message !== 'Entity has already been taken') {
        this.syncing = false
        throw new Error(err.response.data.message)
      }
    }

    return this.client.post(`${this.endpoint}/gazettes`, entity)
  }

  async _getIntentsHash() {
    const localIntents = await this.storage.getIntents()

    return crypto
      .createHash('md5')
      .update(JSON.stringify(localIntents))
      .digest('hex')
  }

  async _onSyncSuccess() {
    const intentsHash = await this._getIntentsHash()

    await this.kvs.set(RECAST_HASH_KVS_KEY, intentsHash)
    this.syncing = false
  }

  /*******
  Public API
  *******/

  async init() {
    const { data: { results } } = await this._getBotModel()
    this.defaultLanguage = results.language.isocode
  }

  async sync() {
    if (this.syncing) {
      this.logger.warn('[NLU::Recast] Model is already syncing !')
      return
    }

    this.syncing = true
    this.logger.debug('[NLU::Recast] Syncing Model...')

    try {
      // Delete all gazettes
      let { data: { results: remoteGazettes } } = await this._getRemoteGazettes()

      for (const e of _.map(remoteGazettes, 'slug')) {
        await this._deleteGazette(e)
      }

      // Create entities and gazettes
      const customEntities = await this.getCustomEntities()
      remoteGazettes = []

      for (const e of customEntities) {
        const { data: { results: remoteGazette } } = await this._postGazette(e.definition)
        remoteGazettes.push(_.pick(remoteGazette, ['slug', 'entity.id']))
      }

      // Delete then create intents and update expressions with entities
      const localIntents = await this.storage.getIntents()
      const { data: { results: remoteIntents } } = await this._getRemoteIntents()

      // Delete all intents
      for (const i of _.map(remoteIntents, 'slug')) {
        await this._deleteIntent(i)
      }

      for (const intent of localIntents) {
        if (intent.utterances.length === 0) {
          this.logger.warn(`[NLU::Recast] Intent ${intent.name} has been skipped because it has no utterances`)
          continue
        }

        // Post the intent
        const utterances = _.map(intent.utterances, u => this.parser.extractLabelsFromCanonical(u, intent.entities))
        const expressions = _.map(utterances, u => ({
          source: u.text,
          language: { isocode: this.defaultLanguage }
        }))
        await this._postIntent({ name: intent.name, expressions })

        // Wait for the expressions of the intents to be created
        while (true) {
          const { data: { results } } = await this._getBulkCreations()

          if (results.length === 0) {
            break
          }

          await Promise.delay(1000)
        }

        // Update expressions with entities
        const { data: { results: remoteIntentExpressions } } = await this._getRemoteIntentExpressions(intent.name)

        for (const expr of remoteIntentExpressions) {
          const utterance = utterances.find(u => u.text === expr.source)

          if (utterance && utterance.labels.length) {
            const { data: { results: remoteIntentExpression } } = await this._getRemoteExpression(intent.name, expr.id)

            for (const label of utterance.labels) {
              const word = utterance.text.substr(label.start, label.end - label.start + 1)
              const token = remoteIntentExpression.tokens.find(t => t.word.name === word)

              if (token && (!token.entity || token.entity.slug !== label.type)) {
                const gazette = remoteGazettes.find(e => e.slug === label.type)
                token.entity = { id: gazette.entity.id }
                const expression = { source: expr.source, tokens: [token] }
                await this._updateRemoteExpression(intent.name, expr.id, expression)
              }
            }
          }
        }
      }
    } catch (err) {
      this.syncing = false
      throw new Error(err.response.data.message)
    }

    await this._onSyncSuccess()

    this.logger.info('[NLU::Recast] Synced Model')
  }

  async checkSyncNeeded() {
    const intentsHash = await this._getIntentsHash()
    const savedHash = await this.kvs.get(RECAST_HASH_KVS_KEY)

    return savedHash !== intentsHash
  }

  async extract(incomingEvent) {
    const { data: { results } } = await this.client.post('/request', {
      text: incomingEvent.text
    })

    const intentName = _.get(results.intents[0], 'slug') || 'None'
    const confidence = _.get(results.intents[0], 'confidence') || 0
    const entities = []
    _.forEach(results.entities, (value, key) => {
      value.forEach(e => entities.push({ ...e, entityType: key }))
    })

    return {
      intent: {
        name: intentName,
        confidence: confidence,
        provider: 'recast'
      },
      intents: results.intents.map(intent => ({
        name: intent.slug,
        confidence: intent.confidence,
        provider: 'recast'
      })),
      entities: entities.map(entity => {
        let value = _.omit(entity, ['confidence', 'entityType', 'raw'])
        const valueSize = _.size(value)
        if (valueSize === 1) {
          value = value[Object.keys(value)[0]]
        } else if (valueSize === 0) {
          value = entity.raw
        }

        return {
          name: null,
          type: entity.entityType,
          value,
          original: entity.raw,
          confidence: entity.confidence,
          position: null,
          provider: 'recast'
        }
      }),
      act: results.act, // Recast custom
      type: results.type, // Recast custom
      language: {
        detected: results.language,
        processed: results.processing_language
      },
      sentiment: results.sentiment // Recast custom
    }
  }

  async getCustomEntities() {
    return this.storage.getCustomEntities()
  }
}
