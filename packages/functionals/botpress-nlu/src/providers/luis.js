import axios from 'axios'
import _ from 'lodash'
import crypto from 'crypto'
import Promise from 'bluebird'

import Provider, { defaultExtractData } from './base'
import Entities from './entities'

const LUIS_APP_VERSION = '1.0' // Static, we're not using this as everything is source-controlled in your bot
const LUIS_HASH_KVS_KEY = 'nlu/luis/updateMetadata'

export default class LuisProvider extends Provider {
  constructor(config) {
    super({ ...config, name: 'luis', entityKey: '@luis' })

    this.appId = this.config.luisAppId
    this.programmaticKey = this.config.luisProgrammaticKey
    this.appSecret = this.config.luisAppSecret
    this.appRegion = this.config.luisAppRegion
  }

  async init() {}

  async getRemoteVersion() {
    try {
      const res = await axios.get(
        `https://${this.appRegion}.api.cognitive.microsoft.com/luis/api/v2.0/apps/${this.appId}/versions`,
        {
          headers: {
            'Ocp-Apim-Subscription-Key': this.programmaticKey
          }
        }
      )

      return _.find(res.data, { version: LUIS_APP_VERSION })
    } catch (err) {
      this.logger.debug('[NLU::Luis] Could not fetch app versions')
      return []
    }
  }

  async deleteVersion() {
    try {
      const del = await axios.delete(
        `https://${this.appRegion}.api.cognitive.microsoft.com/luis/api/v2.0/apps/${this
          .appId}/versions/${LUIS_APP_VERSION}/`,
        {
          headers: {
            'Ocp-Apim-Subscription-Key': this.programmaticKey
          }
        }
      )

      if (del.statusCode === 200) {
        this.logger.debug('[NLU::Luis] Removed old version of the model')
      }
    } catch (err) {
      this.logger.debug('[NLU::Luis] Could not remove old version of the model')
    }
  }

  async getAppInfo() {
    try {
      const response = await axios.get(
        `https://${this.appRegion}.api.cognitive.microsoft.com/luis/api/v2.0/apps/${this.appId}`,
        {
          headers: {
            'Ocp-Apim-Subscription-Key': this.programmaticKey
          }
        }
      )
      return response.data
    } catch (err) {
      throw new Error('[NLU::Luis] Could not find app ' + this.appId)
    }
  }

  async isInSync(localIntents, remoteVersion) {
    const intentsHash = crypto
      .createHash('md5')
      .update(JSON.stringify(localIntents))
      .digest('hex')

    const metadata = await this.kvs.get(LUIS_HASH_KVS_KEY)

    return metadata && metadata.hash === intentsHash && metadata.time === remoteVersion.lastModifiedDateTime
  }

  async checkSyncNeeded() {
    const intents = await this.storage.getIntents()
    const currentVersion = await this.getRemoteVersion()
    return !await this.isInSync(intents, currentVersion)
  }

  async onSyncSuccess(localIntents, remoteVersion) {
    const intentsHash = crypto
      .createHash('md5')
      .update(JSON.stringify(localIntents))
      .digest('hex')

    await this.kvs.set(LUIS_HASH_KVS_KEY, {
      hash: intentsHash,
      time: remoteVersion.lastModifiedDateTime
    })
  }

  async getCustomEntities() {
    const { simples, composites, lists } = await this.getCustomLuisEntities()

    const mapToType = (list, type) =>
      list.map(x => ({
        name: '@custom.' + x.name,
        isFromProvider: false,
        nameProvider: x.name,
        providerType: type,
        definition: x
      }))

    return [
      ...mapToType(simples, 'entities'),
      ...mapToType(composites, 'composites'),
      ...mapToType(lists, 'closedLists')
    ]
  }

  async getCustomLuisEntities() {
    const entities = await this.storage.getCustomEntities()

    const simplesDef = _.find(entities, e => e.name.toLowerCase() === 'luis_entities')
    const compositesDef = _.find(entities, e => e.name.toLowerCase() === 'luis_composites')
    const listsDef = _.find(entities, e => e.name.toLowerCase() === 'luis_closedlists')

    const simples = (simplesDef && simplesDef.definition) || []
    const composites = (compositesDef && compositesDef.definition) || []
    const lists = (listsDef && listsDef.definition) || []

    return { simples, composites, lists }
  }

  validateCredentials() {
    const missingPattern = name =>
      '[NLU::LUIS] "' +
      name +
      '" is missing from the configuration, please have a look at botpress-nlu ' +
      'documentation to learn how to setup the credentials.'

    if (_.isEmpty(this.appId)) {
      throw new Error(missingPattern('Application Id'))
    }

    if (_.isEmpty(this.programmaticKey)) {
      throw new Error(missingPattern('Programmatic Key'))
    }

    if (_.isEmpty(this.appId)) {
      throw new Error(missingPattern('Application Secret'))
    }

    if (_.isEmpty(this.appId)) {
      throw new Error(missingPattern('Application Region'))
    }
  }

  async sync() {
    if (this.syncingSince && new Date() - this.syncingSince <= 10 * 60 * 1000) {
      this.logger.warn('[NLU::Luis] Tried to sync while syncing in progress')
      return
    }

    this.syncingSince = new Date()

    this.validateCredentials()

    const intents = await this.storage.getIntents()
    let currentVersion = await this.getRemoteVersion()

    if (await this.isInSync(intents, currentVersion)) {
      this.logger.debug('[NLU::Luis] Model is up to date')
      return
    } else {
      this.logger.debug('[NLU::Luis] The model needs to be updated')
    }

    if (currentVersion) {
      this.logger.debug('[NLU::Luis] Deleting old version of the model')
      await this.deleteVersion()
    }

    const utterances = []

    const builtinEntities = []
    const simpleEntities = []
    const compositeEntities = []
    const listEntities = []

    const availableEntities = await this.getAvailableEntities()

    intents.forEach(intent => {
      intent.utterances.forEach(utterance => {
        const extracted = this.parser.extractLabelsFromCanonical(utterance, intent.entities)
        if (!extracted.text || !extracted.text.trim()) {
          return
        }

        const entities = []

        extracted.labels.forEach(label => {
          const entity = _.find(availableEntities, { name: label.type })

          if (!entity) {
            throw new Error('[NLU::Luis] Unknown entity: ' + label.type)
          }

          if (entity.isFromProvider && builtinEntities.indexOf(entity.nameProvider) === -1) {
            builtinEntities.push(entity.nameProvider)
          } else if (entity.providerType === 'entities' && !_.find(simpleEntities, { name: entity.nameProvider })) {
            simpleEntities.push(entity.definition)
          } else if (
            entity.providerType === 'composites' &&
            !_.find(compositeEntities, { name: entity.nameProvider })
          ) {
            compositeEntities.push(entity.definition)
          } else if (entity.providerType === 'closedLists' && !_.find(listEntities, { name: entity.nameProvider })) {
            listEntities.push(entity.definition)
          }

          entities.push({
            entity: entity.nameProvider,
            startPos: label.start,
            endPos: label.end
          })
        })

        utterances.push({
          text: extracted.text,
          intent: intent.name,
          entities: entities
        })
      })
    })

    const appInfo = await this.getAppInfo()

    const body = {
      luis_schema_version: '2.1.0',
      versionId: LUIS_APP_VERSION,
      name: appInfo.name,
      desc: appInfo.description,
      culture: appInfo.culture,
      intents: intents.map(i => ({ name: i.name })),
      entities: simpleEntities,
      composites: compositeEntities,
      closedLists: listEntities,
      bing_entities: builtinEntities,
      model_features: [],
      regex_features: [],
      utterances: utterances
    }

    try {
      const result = await axios.post(
        `https://${this.appRegion}.api.cognitive.microsoft.com/luis/api/v2.0/apps/${this
          .appId}/versions/import?versionId=${LUIS_APP_VERSION}`,
        body,
        {
          headers: {
            'Ocp-Apim-Subscription-Key': this.programmaticKey
          }
        }
      )

      await this.train()

      currentVersion = await this.getRemoteVersion()
      await this.onSyncSuccess(intents, currentVersion)

      this.logger.info('[NLU::Luis] Synced model [' + result.data + ']')
    } catch (err) {
      const detailedError = _.get(err, 'response.data.error.message') || (err && err.message) || err
      this.logger.error('[NLU::Luis] Could not sync the model. Error = ' + detailedError)
    }
    this.syncingSince = null
  }

  async train() {
    let res = await axios.post(
      `https://${this.appRegion}.api.cognitive.microsoft.com/luis/api/v2.0/apps/${this
        .appId}/versions/${LUIS_APP_VERSION}/train`,
      {},
      {
        headers: {
          'Ocp-Apim-Subscription-Key': this.programmaticKey
        }
      }
    )

    if (res.data.status !== 'Queued') {
      throw new Error('Expected training to be Queued but was: ' + res.data.status)
    }

    while (true) {
      res = await axios.get(
        `https://${this.appRegion}.api.cognitive.microsoft.com/luis/api/v2.0/apps/${this
          .appId}/versions/${LUIS_APP_VERSION}/train`,
        {
          headers: {
            'Ocp-Apim-Subscription-Key': this.programmaticKey
          }
        }
      )

      const models = res.data

      const percent = (models.length - _.filter(models, m => m.details.status === 'InProgress').length) / models.length

      const error = _.find(models, m => m.details.status === 'Fail')

      if (error) {
        throw new Error(
          `[NLU::Luis] Error training model "${error.modelId}", reason is "${error.details.failureReason}"`
        )
      }

      if (percent >= 1) {
        this.logger.debug('[NLU::Luis] Model trained (100%)')
        break
      } else {
        this.logger.debug('[NLU::Luis] Training... ' + percent.toFixed(2) * 100 + '%')
      }

      await Promise.delay(1000)
    }

    await Promise.delay(1000)

    await axios.post(
      `https://${this.appRegion}.api.cognitive.microsoft.com/luis/api/v2.0/apps/${this.appId}/publish`,
      {
        versionId: LUIS_APP_VERSION,
        isStaging: !this.isProduction,
        region: this.appRegion
      },
      {
        headers: {
          'Ocp-Apim-Subscription-Key': this.programmaticKey
        }
      }
    )
  }

  async extract(incomingEvent) {
    try {
      this.validateCredentials()
    } catch (err) {
      this.logger.warn(
        '[NLU::Luis] Did not extract NLU metadata for incoming text because Luis is not configured properly.'
      )

      return defaultExtractData('luis')
    }

    const res = await axios.get(`https://${this.appRegion}.api.cognitive.microsoft.com/luis/v2.0/apps/${this.appId}`, {
      params: {
        q: incomingEvent.text,
        verbose: true,
        spellCheck: false,
        staging: !this.isProduction
      },
      headers: {
        'Ocp-Apim-Subscription-Key': this.appSecret
      }
    })

    const intentName = _.get(res, 'data.topScoringIntent.intent') || 'None'
    const confidence = _.get(res, 'data.topScoringIntent.score') || 0
    const intents = _.get(res, 'data.intents') || []
    const entities = _.get(res, 'data.entities') || []

    return {
      intent: {
        name: intentName,
        confidence: parseFloat(confidence),
        provider: 'luis'
      },
      intents: intents.map(intent => ({
        name: intent.intent,
        confidence: parseFloat(intent.score),
        provider: 'luis'
      })),
      entities: entities.map(entity => ({
        name: null,
        type: entity.type,
        value:
          _.get(entity, 'resolution.values.0.value') ||
          _.get(entity, 'resolution.value') ||
          _.get(entity, 'resolution.values.0') ||
          entity.entity,
        original: entity.entity,
        confidence: null,
        position: entity.startIndex,
        provider: 'luis'
      }))
    }
  }
}
