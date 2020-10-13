import axios, { AxiosInstance } from 'axios'
import * as sdk from 'botpress/sdk'
import { NLU } from 'botpress/sdk'

import { LegacyIntentService } from './intents/legacy-intent-service'
import { INLUService, LegacyIntentDefinition } from './typings'

export class NLUService implements INLUService {
  private _isLegacy: boolean
  private _botId: string
  private _client: AxiosInstance

  constructor(
    private bp: typeof sdk,
    botConfig: sdk.BotConfig,
    private legacyIntentService: LegacyIntentService,
    private logger: NLU.Logger
  ) {
    this._isLegacy = !botConfig.oneflow
    this._botId = botConfig.id
  }

  public async getIntentsAndEntities(): Promise<{
    intentDefs: NLU.IntentDefinition[]
    entityDefs: NLU.EntityDefinition[]
  }> {
    this._client = axios.create(await this.bp.http.getAxiosConfigForBot(this._botId, { localUrl: true }))

    if (this._isLegacy) {
      const entities = await this._getEntities()
      const legacyIntents = await this.legacyIntentService.getIntents()
      return this._mapLegacySlots(legacyIntents, entities)
    }

    const intentDefs = await this._getIntents()
    const entityDefs = await this._getEntities()

    return {
      intentDefs,
      entityDefs
    }
  }

  public async _getEntities(): Promise<sdk.NLU.EntityDefinition[]> {
    try {
      const { data } = await this._client.get('/nlu/entities')
      return data
    } catch (err) {
      this.logger.error('An error occured when fetching entities from the core', err)
      return []
    }
  }

  private async _getIntents(): Promise<sdk.NLU.IntentDefinition[]> {
    try {
      const { data } = await this._client.get('/nlu/intents')
      return data
    } catch (err) {
      this.logger.error('An error occured when fetching intents from the core', err)
      return []
    }
  }

  private _mapLegacySlots(legacyIntents: LegacyIntentDefinition[], entities: NLU.EntityDefinition[]) {
    const patterns = entities.filter(e => e.type === 'pattern')
    const enums = entities.filter(e => e.type === 'list')
    const systems = entities.filter(e => e.type === 'system')
    const complexs: NLU.EntityDefinition[] = []

    const newIntents: NLU.IntentDefinition[] = []
    for (const intent of legacyIntents) {
      const newSlots: NLU.SlotDefinition[] = []
      for (const slot of intent.slots) {
        let newSlot: NLU.SlotDefinition

        newSlot = { name: slot.name, entity: slot.name }

        const pattern_entities = slot.entities.filter(e => patterns.map(p => p.name).includes(e))
        const list_entities = slot.entities.filter(e => enums.map(p => p.name).includes(e))
        const system_entities = slot.entities.filter(e => systems.map(p => p.name).includes(e))

        complexs.push({
          id: slot.id,
          name: slot.name,
          type: 'complex',
          list_entities,
          pattern_entities,
          system_entities,
          examples: [] // no examples required as legacy utterances still uses markdown notation
        })

        newSlots.push(newSlot)
      }
      newIntents.push({ ...intent, slots: newSlots })
    }

    const newEntities = [...patterns, ...enums, ...systems, ...complexs]
    return { intentDefs: newIntents, entityDefs: newEntities }
  }
}
