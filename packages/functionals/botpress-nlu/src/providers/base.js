const ENVIRONEMENT = process.env.NODE_ENV === 'production' ? 'prod' : 'dev'

import Entities from './entities'
import _ from 'lodash'

export default class Provider {
  constructor({ name, entityKey, logger, config, storage, parser, kvs }) {
    this.name = name
    this.entityKey = entityKey
    this.logger = logger
    this.storage = storage
    this.kvs = kvs
    this.config = config
    this.parser = parser
    this.isProduction = ENVIRONEMENT === 'prod'
    this.env = ENVIRONEMENT
  }

  /*******
  Public API
  *******/

  async init() {}

  async sync() {
    throw new Error('Not implemented')
  }

  async checkSyncNeeded() {
    throw new Error('Not implemented')
  }

  async extract(incomingText) {
    throw new Error('Not implemented')
  }

  async getCustomEntities() {
    throw new Error('Not implemented')
  }

  /*******
  Shared API
  *******/

  async getAvailableEntities() {
    return [...(await this.getCustomEntities()), ...(await this._getProviderEntities())]
  }

  /*******
  Private Methods
  *******/

  async _getProviderEntities() {
    return _.toPairs(Entities)
      .filter(p => p[1][this.entityKey])
      .map(p => ({
        name: p[0],
        isFromProvider: true,
        nameProvider: p[1][this.entityKey]
      }))
  }
}

export const defaultExtractData = provider => ({
  intent: {
    name: 'None',
    confidence: 0,
    provider
  },
  intents: [],
  entities: []
})
