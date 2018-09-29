import axios, { AxiosInstance } from 'axios'
import crypto from 'crypto'
import _ from 'lodash'
import ms from 'ms'

import Provider, { defaultExtractData } from './base'

const RASA_HASH_KVS_KEY = 'nlu/rasa/updateMetadata'

export default class RasaProvider extends Provider {
  private endpoint: any
  private token: any
  private project: any
  private client: AxiosInstance
  private modelId: any
  private training: any

  constructor(config) {
    super({ ...config, name: 'rasa', entityKey: '@rasa' })

    this.endpoint = this.config.rasaEndpoint
    this.token = this.config.rasaToken
    this.project = this.config.rasaProject

    this.client = axios.create({
      baseURL: this.endpoint,
      params: this.token && this.token.length ? { token: this.token } : {}
    })
  }

  async init() {}

  async checkSyncNeeded() {
    const intents = await this.storage.getIntents()
    const remoteVersions = await this.getRemoteVersions()
    return !(await this.isInSync(intents, remoteVersions))
  }

  private getProjectName() {
    const scope = 'all'
    return `${this.env}__${this.project}__${scope}`
  }

  private async getRemoteVersions() {
    try {
      const projectName = this.getProjectName()
      const res = await this.client.get('/status')
      const versions = _.get(res, 'data.available_projects.' + projectName + '.available_models') || []
      return versions
    } catch (err) {
      this.logger.debug('[NLU::Rasa] Could not fetch model versions')
      return []
    }
  }

  private async isInSync(localIntents, remoteVersions) {
    const intentsHash = crypto
      .createHash('md5')
      .update(JSON.stringify(localIntents))
      .digest('hex')

    const metadata = await this.kvs.get(this.botId, RASA_HASH_KVS_KEY)

    return metadata && metadata.hash === intentsHash && _.includes(remoteVersions, metadata.modelId)
  }

  private async onSyncSuccess(localIntents) {
    const intentsHash = crypto
      .createHash('md5')
      .update(JSON.stringify(localIntents))
      .digest('hex')

    const versions = await this.getRemoteVersions()

    const version = _.last(_.sortBy(versions))

    if (!version) {
      throw new Error('[NLU::Rasa] Could not sync model, could not list project models after training')
    }

    await this.kvs.set(this.botId, RASA_HASH_KVS_KEY, {
      hash: intentsHash,
      modelId: version
    })
  }

  private async cacheLatestModel() {
    const metadata = await this.kvs.get(this.botId, RASA_HASH_KVS_KEY)
    this.modelId = metadata.modelId
    return metadata.modelId
  }

  async getCustomEntities() {
    // RASA doesn't support custom entity types (version 0.10 as of writing)
    return []
  }

  async sync() {
    const intents = await this.storage.getIntents()
    const remoteVersions = await this.getRemoteVersions()

    if (await this.isInSync(intents, remoteVersions)) {
      this.logger.debug('[NLU::Rasa] Model is up to date')
      return
    } else {
      this.logger.debug('[NLU::Rasa] The model needs to be updated')
    }

    const sample = {
      rasa_nlu_data: {
        common_examples: [],
        regex_features: [],
        entity_synonyms: []
      }
    }

    const common_examples = []

    intents.forEach(intent => {
      intent.utterances.forEach(utterance => {
        const extracted = this.parser.extractLabelsFromCanonical(utterance, intent.entities)
        const entities = []

        extracted.labels.forEach(label => {
          entities.push({
            entity: label.entityName,
            value: extracted.text.substr(label.start, label.end - label.start + 1),
            start: label.start,
            end: label.end + 1
          })
        })

        common_examples.push({
          text: extracted.text,
          intent: intent.name,
          entities: entities
        })
      })
    })

    if (this.training) {
      return this.logger.warn('[NLU::Rasa] Training is already in progress, aborting this request')
    } else {
      this.training = true
      this.logger.debug(`[NLU::Rasa] Started training model from ${common_examples.length} samples`)
    }

    try {
      await this.client.post(
        '/train',
        {
          rasa_nlu_data: {
            common_examples: common_examples,
            regex_features: [], // TODO Implement that
            entity_synonyms: []
          }
        },
        {
          timeout: ms('30m'),
          params: {
            project: this.getProjectName()
          }
        }
      )
    } catch (err) {
      this.training = false

      const msg = `"${_.get(err, 'response.data')}" Status: ${err.status} | Message: ${err.message}`

      if (err.status == 403) {
        const errorMsg = `[NLU::Rasa] A model is already training, aborting sync: ${msg}`

        this.logger.warn(errorMsg)
        throw new Error(errorMsg)
      }

      if (err.status == 404) {
        const errorMsg = `[NLU::Rasa] Invalid project error: ${msg}`

        this.logger.warn(errorMsg)
        throw new Error(errorMsg)
      }

      if (err.status == 500) {
        const errorMsg = `[NLU::Rasa] Training error: ${msg}`

        this.logger.warn(errorMsg)
        throw new Error(errorMsg)
      }

      const errorMsg = `[NLU::Rasa] Error syncing model: ${msg}`

      this.logger.error(errorMsg)
      throw new Error(errorMsg)
    }

    this.training = false

    await this.onSyncSuccess(intents)

    const latestModel = await this.cacheLatestModel()

    this.logger.info(`[NLU::Rasa] Synced model [Model=${latestModel}]`)
  }

  async extract(incomingEvent) {
    let modelId = this.modelId

    if (!modelId) {
      modelId = await this.cacheLatestModel()
    }

    if (!modelId) {
      const versions = await this.getRemoteVersions()

      if (!versions.length) {
        this.sync() // Async
        this.logger.error(
          '[NLU:Rasa] Your model needs to be trained at least once in this environment before extraction can be done'
        )

        return defaultExtractData('rasa')
      }

      this.modelId = modelId = _.last(_.sortBy(versions))
      this.logger.warn(
        '[NLU:Rasa] Model not specified, using latest one. Retrain in this environment to fix this warning.'
      )

      return defaultExtractData('rasa')
    }

    const res = await this.client.post('/parse', {
      q: incomingEvent.text,
      project: this.getProjectName(),
      model: modelId
    })

    const intentName = _.get(res, 'data.intent.name') || 'None'
    const confidence = _.get(res, 'data.intent.confidence') || 0
    const intents = _.get(res, 'data.intent_ranking') || []
    const entities = _.get(res, 'data.entities') || []

    return {
      intent: {
        name: intentName,
        confidence: parseFloat(confidence),
        provider: 'rasa'
      },
      intents: intents.map(intent => ({
        name: intent.name,
        confidence: parseFloat(intent.confidence),
        provider: 'rasa'
      })),
      entities: entities.map(entity => ({
        name: undefined,
        type: entity.entity,
        value: entity.value,
        original: entity.text,
        confidence: undefined,
        position: entity.start,
        provider: entity.extractor
      }))
    }
  }
}
