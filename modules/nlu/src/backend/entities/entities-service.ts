import * as sdk from 'botpress/sdk'

import * as CacheManager from '../cache-manager'
import { updateIntentsSlotsEntities } from '../intents/intent-service'
import { EntityService } from '../typings'

import { DucklingEntityExtractor } from './duckling_extractor'

const ENTITIES_DIR = './entities'

export default class EntitiesService implements EntityService {
  constructor(private ghost: sdk.ScopedGhostService, private botId: string) {}

  private sanitizeFileName(name: string): string {
    return name
      .toLowerCase()
      .replace(/\.json$/i, '')
      .replace(/[\t\s]/gi, '-')
  }

  private entityExists(entityName: string): Promise<boolean> {
    return this.ghost.fileExists(ENTITIES_DIR, `${entityName}.json`)
  }

  public getSystemEntities(): sdk.NLU.EntityDefinition[] {
    return [...DucklingEntityExtractor.entityTypes, 'any'].map(e => ({
      name: e,
      type: 'system'
    })) as sdk.NLU.EntityDefinition[]
  }

  public async getCustomEntities(): Promise<sdk.NLU.EntityDefinition[]> {
    const intentNames = await this.ghost.directoryListing(ENTITIES_DIR, '*.json')
    return Promise.mapSeries(intentNames, n => this.getEntity(n))
  }

  public async getEntities(): Promise<sdk.NLU.EntityDefinition[]> {
    return [...this.getSystemEntities(), ...(await this.getCustomEntities())]
  }

  public async getEntity(entityName: string): Promise<sdk.NLU.EntityDefinition> {
    entityName = this.sanitizeFileName(entityName)

    if (!(await this.entityExists(entityName))) {
      throw new Error('Entity does not exist')
    }
    return this.ghost.readFileAsObject(ENTITIES_DIR, `${entityName}.json`)
  }

  public async deleteEntity(entityName: string): Promise<void> {
    const nameSanitized = this.sanitizeFileName(entityName)
    if (!(await this.entityExists(nameSanitized))) {
      throw new Error('Entity does not exist')
    }

    CacheManager.deleteCache(entityName, this.botId)
    return this.ghost.deleteFile(ENTITIES_DIR, `${nameSanitized}.json`)
  }

  public async saveEntity(entity: sdk.NLU.EntityDefinition): Promise<void> {
    const nameSanitized = this.sanitizeFileName(entity.name)
    return this.ghost.upsertFile(ENTITIES_DIR, `${nameSanitized}.json`, JSON.stringify(entity, undefined, 2))
  }

  public async updateEntity(targetEntityName: string, entity: sdk.NLU.EntityDefinition): Promise<void> {
    const nameSanitized = this.sanitizeFileName(entity.name)
    const targetSanitized = this.sanitizeFileName(targetEntityName)

    if (targetSanitized !== nameSanitized) {
      // entity renamed
      CacheManager.copyCache(targetEntityName, entity.name, this.botId)
      await Promise.all([
        this.deleteEntity(targetSanitized),
        updateIntentsSlotsEntities(this.ghost, targetSanitized, nameSanitized, this)
      ])
    } else {
      // entity changed
      CacheManager.getOrCreateCache(targetEntityName, this.botId).reset()
    }
    await this.saveEntity(entity)
  }
}
