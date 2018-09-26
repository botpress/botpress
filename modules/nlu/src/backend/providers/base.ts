const ENVIRONEMENT = process.env.NODE_ENV === 'production' ? 'prod' : 'dev'

import Entities from './entities'
import _ from 'lodash'

export default abstract class Provider {
  protected name: any
  protected entityKey: any
  protected logger: any
  protected storage: any
  protected kvs: any
  protected config: any
  protected parser: any
  protected isProduction: boolean
  protected env: string

  constructor(private args: { name; entityKey; logger; config; storage; parser; kvs }) {
    this.name = args.name
    this.entityKey = args.entityKey
    this.logger = args.logger
    this.storage = args.storage
    this.kvs = args.kvs
    this.config = args.config
    this.parser = args.parser
    this.isProduction = ENVIRONEMENT === 'prod'
    this.env = ENVIRONEMENT
  }

  async init() {}

  abstract async sync()

  abstract async checkSyncNeeded()

  abstract async extract(incomingText)

  abstract async getCustomEntities(): Promise<any>

  protected async getAvailableEntities() {
    return [...(await this.getCustomEntities()), ...(await this._getProviderEntities())]
  }

  private async _getProviderEntities() {
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
