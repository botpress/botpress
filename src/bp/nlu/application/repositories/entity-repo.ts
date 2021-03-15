import * as sdk from 'botpress/sdk'

import { SYSTEM_ENTITIES } from 'common/nlu/engine'
import { GhostService } from 'core/services'
import * as CacheManager from './cache-manager'
import { sanitizeFileName } from './utils'

const ENTITIES_DIR = './entities'

const getSystemEntities = (): sdk.NLU.EntityDefinition[] => {
  return [...SYSTEM_ENTITIES, 'any'].map(name => ({ name, type: 'system' })) as sdk.NLU.EntityDefinition[]
}

type RenameListener = (botId: string, oldName: string, newName: string) => Promise<void>

export class EntityRepository {
  private _renameListeners: RenameListener[] = []

  constructor(private ghostService: GhostService) {}

  public listenForEntityRename(l: RenameListener) {
    this._renameListeners.push(l)
  }

  private entityExists(botId: string, entityName: string): Promise<boolean> {
    return this.ghostService.forBot(botId).fileExists(ENTITIES_DIR, `${entityName}.json`)
  }

  public async getCustomEntities(botId: string): Promise<sdk.NLU.EntityDefinition[]> {
    const intentNames = await this.ghostService.forBot(botId).directoryListing(ENTITIES_DIR, '*.json')
    return Promise.mapSeries(intentNames, n => this.getEntity(botId, n))
  }

  public async getEntities(botId: string): Promise<sdk.NLU.EntityDefinition[]> {
    return [...getSystemEntities(), ...(await this.getCustomEntities(botId))]
  }

  public async getEntity(botId: string, entityName: string): Promise<sdk.NLU.EntityDefinition> {
    entityName = sanitizeFileName(entityName)

    if (!(await this.entityExists(botId, entityName))) {
      throw new Error('Entity does not exist')
    }
    return this.ghostService.forBot(botId).readFileAsObject(ENTITIES_DIR, `${entityName}.json`)
  }

  public async deleteEntity(botId: string, entityName: string): Promise<void> {
    const nameSanitized = sanitizeFileName(entityName)
    if (!(await this.entityExists(botId, nameSanitized))) {
      throw new Error('Entity does not exist')
    }

    CacheManager.deleteCache(entityName, botId)
    return this.ghostService.forBot(botId).deleteFile(ENTITIES_DIR, `${nameSanitized}.json`)
  }

  public async saveEntity(botId: string, entity: sdk.NLU.EntityDefinition): Promise<void> {
    const nameSanitized = sanitizeFileName(entity.name)
    return this.ghostService
      .forBot(botId)
      .upsertFile(ENTITIES_DIR, `${nameSanitized}.json`, JSON.stringify(entity, undefined, 2))
  }

  public async updateEntity(botId: string, targetEntityName: string, entity: sdk.NLU.EntityDefinition): Promise<void> {
    const nameSanitized = sanitizeFileName(entity.name)
    const targetSanitized = sanitizeFileName(targetEntityName)

    if (targetSanitized !== nameSanitized) {
      // entity renamed
      CacheManager.copyCache(targetEntityName, entity.name, botId)
      await Promise.all([
        this.deleteEntity(botId, targetSanitized),
        this._renameListeners.forEach(l => l(botId, targetSanitized, nameSanitized))
      ])
    } else {
      // entity changed
      CacheManager.getOrCreateCache(targetEntityName, botId).reset()
    }
    await this.saveEntity(botId, entity)
  }
}
