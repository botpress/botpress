import * as sdk from 'botpress/sdk'
import { ScopedGhostService } from 'botpress/sdk'
import _ from 'lodash'
import path from 'path'

import { Config } from '../config'
import { sanitizeFilenameNoExt } from '../util.js'

import { Model, ModelMeta } from './typings'

export default class Storage {
  static ghostProvider: (botId: string) => sdk.ScopedGhostService

  private readonly ghost: ScopedGhostService
  private readonly intentsDir: string
  private readonly entitiesDir: string
  private readonly modelsDir: string
  private readonly config: Config

  constructor(config: Config, private readonly botId: string) {
    this.config = config
    this.intentsDir = config.intentsDir
    this.entitiesDir = config.entitiesDir
    this.modelsDir = config.modelsDir
    this.ghost = Storage.ghostProvider(this.botId)
  }

  async saveIntent(intent: string, content: sdk.NLU.IntentDefinition) {
    intent = sanitizeFilenameNoExt(intent)
    const entities = await this.getAvailableEntities()

    if (content.slots) {
      await Promise.map(content.slots, async slot => {
        if (!entities.find(e => e.name === slot.entity)) {
          throw Error(`"${slot.entity}" is neither a system entity nor a custom entity`)
        }
      })
    }

    if (intent.length < 1) {
      throw new Error('Invalid intent name, expected at least one character')
    }

    await this.ghost.upsertFile(this.intentsDir, `${intent}.json`, JSON.stringify(content, undefined, 2))
  }

  async deleteIntent(intent) {
    intent = sanitizeFilenameNoExt(intent)

    if (intent.length < 1) {
      throw new Error('Invalid intent name, expected at least one character')
    }

    try {
      await this.ghost.deleteFile(this.intentsDir, `${intent}.json`)
    } catch (e) {
      if (e.code !== 'ENOENT' && !e.message.includes("couldn't find")) {
        throw e
      }
    }
  }

  async getIntents(): Promise<sdk.NLU.IntentDefinition[]> {
    const intents = await this.ghost.directoryListing(this.intentsDir, '*.json')
    return Promise.mapSeries(intents, intent => this.getIntent(intent))
  }

  async getIntent(intent: string): Promise<sdk.NLU.IntentDefinition> {
    intent = sanitizeFilenameNoExt(intent)

    if (intent.length < 1) {
      throw new Error('Invalid intent name, expected at least one character')
    }

    const filename = `${intent}.json`
    const propertiesContent = await this.ghost.readFileAsString(this.intentsDir, filename)
    let properties: any = {}

    try {
      properties = JSON.parse(propertiesContent)
    } catch (err) {
      throw new Error(`Could not parse intent properties (invalid JSON). JSON = "${propertiesContent}"`)
    }

    const obj = {
      name: intent,
      filename: filename,
      ...properties
    }

    // @deprecated remove in 12+
    if (!properties.utterances) {
      await this._legacyAppendIntentUtterances(obj, intent)
      await this.saveIntent(intent, obj)
    }

    return obj
  }

  /** @deprecated remove in 12.0+
   * utterances used to be defined in a separate .txt file
   * this is not the case anymore since 11.2
   * we added this method for backward compatibility
   */
  private async _legacyAppendIntentUtterances(intent: any, intentName: string) {
    const filename = `${intentName}.utterances.txt`

    const utterancesContent = await this.ghost.readFileAsString(this.intentsDir, filename)
    intent.utterances = _.split(utterancesContent, /\r|\r\n|\n/i).filter(x => x.length)
    await this.ghost.deleteFile(this.intentsDir, filename)
  }

  async getAvailableEntities(): Promise<sdk.NLU.EntityDefinition[]> {
    return [...this.getSystemEntities(), ...(await this.getCustomEntities())]
  }

  getSystemEntities(): sdk.NLU.EntityDefinition[] {
    // TODO move this array as static method in DucklingExtractor
    const sysEntNames = !this.config.ducklingEnabled
      ? []
      : [
        'amountOfMoney',
        'distance',
        'duration',
        'email',
        'numeral',
        'ordinal',
        'phoneNumber',
        'quantity',
        'temperature',
        'time',
        'url',
        'volume'
      ]
    sysEntNames.unshift('any')

    return sysEntNames.map(
      e =>
        ({
          name: e,
          type: 'system'
        } as sdk.NLU.EntityDefinition)
    )
  }

  async getCustomEntities(): Promise<sdk.NLU.EntityDefinition[]> {
    const files = await this.ghost.directoryListing(this.entitiesDir, '*.json')
    return Promise.mapSeries(files, async fileName => {
      const body = await this.ghost.readFileAsObject<sdk.NLU.EntityDefinition>(this.entitiesDir, fileName)
      return { ...body, id: sanitizeFilenameNoExt(fileName) }
    })
  }

  async saveEntity(entity: sdk.NLU.EntityDefinition): Promise<void> {
    const obj = _.omit(entity, ['id'])
    return this.ghost.upsertFile(this.entitiesDir, `${entity.id}.json`, JSON.stringify(obj, undefined, 2))
  }

  async deleteEntity(entityId: string): Promise<void> {
    return this.ghost.deleteFile(this.entitiesDir, `${entityId}.json`)
  }

  private async _persistModel(model: Model) {
    // TODO Ghost to support streams?
    const modelName = `${model.meta.created_on}__${model.meta.hash}__${model.meta.type}.bin`
    return this.ghost.upsertFile(this.modelsDir, modelName, model.model)
  }

  async persistModels(models: Model[]) {
    // TODO perform models cleanup here !!
    return Promise.map(models, model => this._persistModel(model))
  }

  async getAvailableModels(): Promise<ModelMeta[]> {
    const models = await this.ghost.directoryListing(this.modelsDir, '*.bin')
    return models.map(x => {
      const fileName = path.basename(x)
      const parts = fileName.replace('.bin', '').split('__')
      return {
        fileName,
        created_on: parseInt(parts[0]) || 0,
        hash: parts[1],
        type: parts[2],
      }
    })
  }

  async modelExists(modelHash: string): Promise<boolean> {
    const models = await this.getAvailableModels()
    return !!_.find(models, m => m.hash === modelHash)
  }

  async getModelsFromHash(modelHash: string): Promise<Model[]> {
    const modelsMeta = await this.getAvailableModels()
    return Promise.map(
      modelsMeta.filter(meta => meta.hash === modelHash),
      async meta => ({
        meta,
        model: await this.ghost.readFileAsBuffer(this.modelsDir, meta.fileName!)
      })
    )
  }
}
