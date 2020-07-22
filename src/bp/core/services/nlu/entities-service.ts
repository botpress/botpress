import * as sdk from 'botpress/sdk'
import { TYPES } from 'core/types'
import { inject, injectable, tagged } from 'inversify'

import { GhostService } from '..'

import * as CacheManager from './cache-manager'

const ENTITIES_DIR = './entities'

const DUCKLING_ENTITIES = [
  'amountOfMoney',
  'distance',
  'duration',
  'email',
  'number',
  'ordinal',
  'phoneNumber',
  'quantity',
  'temperature',
  'time',
  'url',
  'volume'
]

@injectable()
export class EntityService {
  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'EntityService')
    private logger: sdk.Logger,
    @inject(TYPES.GhostService) private ghostService: GhostService
  ) {}

  private sanitizeFileName(name: string): string {
    return name
      .toLowerCase()
      .replace(/\.json$/i, '')
      .replace(/[\t\s]/gi, '-')
  }

  private entityExists(botId: string, entityName: string): Promise<boolean> {
    return this.ghostService.forBot(botId).fileExists(ENTITIES_DIR, `${entityName}.json`)
  }

  public getSystemEntities(): sdk.NLU.EntityDefinition[] {
    return [...DUCKLING_ENTITIES, 'any'].map(e => ({
      name: e,
      type: 'system'
    })) as sdk.NLU.EntityDefinition[]
  }

  public async getCustomEntities(botId: string): Promise<sdk.NLU.EntityDefinition[]> {
    const intentNames = await this.ghostService.forBot(botId).directoryListing(ENTITIES_DIR, '*.json')
    return Promise.mapSeries(intentNames, n => this.getEntity(botId, n))
  }

  public async getEntities(botId: string): Promise<sdk.NLU.EntityDefinition[]> {
    return [...this.getSystemEntities(), ...(await this.getCustomEntities(botId))]
  }

  public async getEntity(botId: string, entityName: string): Promise<sdk.NLU.EntityDefinition> {
    entityName = this.sanitizeFileName(entityName)

    if (!(await this.entityExists(botId, entityName))) {
      throw new Error('Entity does not exist')
    }
    return this.ghostService.forBot(botId).readFileAsObject(ENTITIES_DIR, `${entityName}.json`)
  }

  public async deleteEntity(botId: string, entityName: string): Promise<void> {
    const nameSanitized = this.sanitizeFileName(entityName)
    if (!(await this.entityExists(botId, nameSanitized))) {
      throw new Error('Entity does not exist')
    }

    CacheManager.deleteCache(entityName, botId)
    return this.ghostService.forBot(botId).deleteFile(ENTITIES_DIR, `${nameSanitized}.json`)
  }

  public async saveEntity(botId: string, entity: sdk.NLU.EntityDefinition): Promise<void> {
    const nameSanitized = this.sanitizeFileName(entity.name)
    return this.ghostService
      .forBot(botId)
      .upsertFile(ENTITIES_DIR, `${nameSanitized}.json`, JSON.stringify(entity, undefined, 2))
  }

  public async updateEntity(botId: string, targetEntityName: string, entity: sdk.NLU.EntityDefinition): Promise<void> {
    const nameSanitized = this.sanitizeFileName(entity.name)
    const targetSanitized = this.sanitizeFileName(targetEntityName)

    if (targetSanitized !== nameSanitized) {
      // entity renamed
      CacheManager.copyCache(targetEntityName, entity.name, botId)
      await Promise.all([
        this.deleteEntity(botId, targetSanitized)
        // TODO find a wait to commuticate with intent service
        // this.intentService.updateIntentsSlotsEntities(botId, targetSanitized, nameSanitized)
      ])
    } else {
      // entity changed
      CacheManager.getOrCreateCache(targetEntityName, botId).reset()
    }
    await this.saveEntity(botId, entity)
  }
}
