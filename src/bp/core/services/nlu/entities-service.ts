import * as sdk from 'botpress/sdk'
import { FlowView } from 'common/typings'
import { sanitizeFileName } from 'core/misc/utils'

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

const FLOWS_DIR = './flows'

const getSystemEntities = (): sdk.NLU.EntityDefinition[] => {
  return [...DUCKLING_ENTITIES, 'any'].map(name => ({ name, type: 'system' })) as sdk.NLU.EntityDefinition[]
}

export class EntityService {
  constructor(private ghostService: GhostService) {}

  private entityExists(botId: string, entityName: string): Promise<boolean> {
    return this.ghostService.forBot(botId).fileExists(ENTITIES_DIR, `${entityName}.json`)
  }

  public async getCustomEntities(botId: string): Promise<sdk.NLU.EntityDefinition[]> {
    const flowEnt = await this.getEntitiesFromFlows(botId)

    const intentNames = await this.ghostService.forBot(botId).directoryListing(ENTITIES_DIR, '*.json')
    const customEnt = await Promise.mapSeries(intentNames, n => this.getEntity(botId, n))

    return [...flowEnt, ...customEnt]
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
      await this.deleteEntity(botId, targetSanitized)
    } else {
      // entity changed
      CacheManager.getOrCreateCache(targetEntityName, botId).reset()
    }
    await this.saveEntity(botId, entity)
  }

  private async getEntitiesFromFlows(botId: string): Promise<sdk.NLU.EntityDefinition[]> {
    const flowsPaths = await this.ghostService.forBot(botId).directoryListing(FLOWS_DIR, '*.flow.json')
    const flows: sdk.Flow[] = await Promise.map(flowsPaths, async (flowPath: string) => ({
      // @ts-ignore
      name: flowPath.replace(/.flow.json$/i, ''),
      ...(await this.ghostService.forBot(botId).readFileAsObject<FlowView>(FLOWS_DIR, flowPath))
    }))

    const entitiesByName: Dic<sdk.NLU.EntityDefinition> = {}

    for (const flow of flows) {
      for (const node of flow.nodes.filter(x => x.type === 'prompt' && x.prompt?.type === 'string')) {
        const tn = node as sdk.TriggerNode

        const enums = tn.prompt?.params?.enumerations ?? []
        const patterns = tn.prompt?.params?.patterns ?? []

        for (let i = 0; i < enums.length; i++) {
          const entityName = sanitizeFileName(`${flow.name}/${tn?.name}/list/${i}`)

          entitiesByName[entityName] = {
            id: entityName,
            name: entityName,
            occurrences: enums[i].occurrences?.map(({ name, tags }) => ({ name, synonyms: tags })),
            fuzzy: enums[i].fuzzy,
            list_entities: [],
            pattern_entities: [],
            type: 'list'
          }
        }

        for (let i = 0; i < patterns.length; i++) {
          const entityName = sanitizeFileName(`${flow.name}/${tn?.name}/pattern/${i}`)

          entitiesByName[entityName] = {
            id: entityName,
            name: entityName,
            matchCase: patterns[i].matchCase,
            sensitive: patterns[i].sensitive,
            pattern: patterns[i].pattern,
            examples: patterns[i].examples,
            list_entities: [],
            pattern_entities: [],
            type: 'pattern'
          }
        }
      }
    }

    return Object.values(entitiesByName)
  }
}
