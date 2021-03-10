import * as sdk from 'botpress/sdk'

import * as CacheManager from './cache-manager'
import { sanitizeFileName } from './utils'

const ENTITIES_DIR = './entities'

const DUCKLING_ENTITIES: string[] = [
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

const getSystemEntities = (): sdk.NLU.EntityDefinition[] => {
  return [...DUCKLING_ENTITIES, 'any'].map(name => ({ name, type: 'system' })) as sdk.NLU.EntityDefinition[]
}

export class EntityRepository {
  constructor(
    private ghostService: typeof sdk.ghost,
    private renameCb: (botId: string, oldName: string, newName: string) => Promise<void>
  ) {}

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
        this.renameCb(botId, targetSanitized, nameSanitized)
      ])
    } else {
      // entity changed
      CacheManager.getOrCreateCache(targetEntityName, botId).reset()
    }
    await this.saveEntity(botId, entity)
  }
}
