import * as sdk from 'botpress/sdk'
import { GhostService } from 'core/bpfs'
import { sanitizeFileName } from 'core/misc/utils'
import * as CacheManager from './cache-manager'
import { NLUService } from './nlu-service'

const ENTITIES_DIR = './entities'

// copied from botpress/nlu repo
const SYSTEM_ENTITIES = [
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
  return [...SYSTEM_ENTITIES, 'any'].map(name => ({ name, type: 'system' })) as sdk.NLU.EntityDefinition[]
}

export class EntityService {
  constructor(private ghostService: GhostService, private nluService: NLUService) {}

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
}
