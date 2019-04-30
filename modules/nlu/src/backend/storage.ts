import * as sdk from 'botpress/sdk'
import { ScopedGhostService } from 'botpress/sdk'
import _ from 'lodash'
import path from 'path'

import { Config } from '../config'
import { sanitizeFilenameNoExt } from '../util.js'

import { Result } from './tools/five-fold'
import { Model, ModelMeta } from './typings'

const N_KEEP_MODELS = 10

export default class Storage {
  static ghostProvider: (botId?: string) => sdk.ScopedGhostService

  private readonly botGhost: ScopedGhostService
  private readonly globalGhost: ScopedGhostService
  private readonly intentsDir: string = './intents'
  private readonly entitiesDir: string = './entities'
  private readonly modelsDir: string = './models'
  private readonly config: Config

  constructor(config: Config, private readonly botId: string) {
    this.config = config
    this.botGhost = Storage.ghostProvider(this.botId)
    this.globalGhost = Storage.ghostProvider()
  }

  async saveIntent(intent: string, content: sdk.NLU.IntentDefinition) {
    intent = sanitizeFilenameNoExt(intent)
    const availableEntities = await this.getAvailableEntities()

    if (content.slots) {
      for (const slot of content.slots) {
        // @deprecated > 11 gracefull migration
        if (!slot.entities && slot.entity) {
          slot.entities = [slot.entity]
        }

        for (const entity of slot.entities) {
          if (!availableEntities.find(e => e.name === entity)) {
            throw Error(`"${entity}" is neither a system entity nor a custom entity`)
          }
        }
      }
    }

    if (!content.contexts) {
      content.contexts = ['global']
    }

    if (intent.length < 1) {
      throw new Error('Invalid intent name, expected at least one character')
    }

    await this.botGhost.upsertFile(this.intentsDir, `${intent}.json`, JSON.stringify(content, undefined, 2))
  }

  async saveConfusionMatrix(modelHash: string, results: Result) {
    await this.botGhost.upsertFile(
      this.modelsDir,
      `confusion__${modelHash}.json`,
      JSON.stringify(results, undefined, 2)
    )
  }

  async getConfusionMatrix(modelHash: string): Promise<Result> {
    return this.botGhost.readFileAsObject<Result>(this.modelsDir, `confusion__${modelHash}.json`)
  }

  async deleteIntent(intent) {
    intent = sanitizeFilenameNoExt(intent)

    if (intent.length < 1) {
      throw new Error('Invalid intent name, expected at least one character')
    }

    try {
      await this.botGhost.deleteFile(this.intentsDir, `${intent}.json`)
    } catch (e) {
      if (e.code !== 'ENOENT' && !e.message.includes("couldn't find")) {
        throw e
      }
    }
  }

  async getIntents(): Promise<sdk.NLU.IntentDefinition[]> {
    const intents = await this.botGhost.directoryListing(this.intentsDir, '*.json')
    return Promise.mapSeries(intents, intent => this.getIntent(intent))
  }

  async getIntent(intent: string): Promise<sdk.NLU.IntentDefinition> {
    intent = sanitizeFilenameNoExt(intent)

    if (intent.length < 1) {
      throw new Error('Invalid intent name, expected at least one character')
    }

    const filename = `${intent}.json`
    const propertiesContent = await this.botGhost.readFileAsString(this.intentsDir, filename)
    let properties: any = {}

    try {
      properties = JSON.parse(propertiesContent)
    } catch (err) {
      throw new Error(
        `Could not parse intent properties (invalid JSON). JSON = "${propertiesContent}" in file "${filename}"`
      )
    }

    const obj = {
      name: intent,
      filename: filename,
      contexts: ['global'], // @deprecated remove in bp > 11
      ...properties
    }

    // @deprecated remove in bp > 11
    let hasChange = false
    if (!properties.utterances) {
      await this._legacyAppendIntentUtterances(obj, intent)
      hasChange = true
    }

    // @deprecated > 11 graceful migration
    for (const slot of obj.slots || []) {
      if (!slot.entities && slot.entity) {
        slot.entities = [slot.entity]
        delete slot.entity
        hasChange = true
      }
    }

    if (hasChange) {
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

    const utterancesContent = await this.botGhost.readFileAsString(this.intentsDir, filename)
    intent.utterances = _.split(utterancesContent, /\r|\r\n|\n/i).filter(x => x.length)
    await this.botGhost.deleteFile(this.intentsDir, filename)
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
    const files = await this.botGhost.directoryListing(this.entitiesDir, '*.json')
    return Promise.mapSeries(files, async fileName => {
      const body = await this.botGhost.readFileAsObject<sdk.NLU.EntityDefinition>(this.entitiesDir, fileName)
      return { ...body, id: sanitizeFilenameNoExt(fileName) }
    })
  }

  async saveEntity(entity: sdk.NLU.EntityDefinition): Promise<void> {
    const obj = _.omit(entity, ['id'])
    return this.botGhost.upsertFile(this.entitiesDir, `${entity.id}.json`, JSON.stringify(obj, undefined, 2))
  }

  async deleteEntity(entityId: string): Promise<void> {
    return this.botGhost.deleteFile(this.entitiesDir, `${entityId}.json`)
  }

  private async _persistModel(model: Model) {
    // TODO Ghost to support streams?
    const modelName = `${model.meta.context}__${model.meta.created_on}__${model.meta.hash}__${model.meta.type}.bin`
    return this.botGhost.upsertFile(this.modelsDir, modelName, model.model)
  }

  private async _cleanupModels(): Promise<void> {
    const models = await this._getAvailableModels(false)
    const uniqModelMeta = _.chain(models)
      .orderBy('created_on', 'desc')
      .uniqBy('hash')
      .value()

    if (uniqModelMeta.length > N_KEEP_MODELS) {
      const threshModel = uniqModelMeta[N_KEEP_MODELS - 1]
      await Promise.all(
        models
          .filter(model => model.created_on < threshModel.created_on && model.hash !== threshModel.hash)
          .map(model => this.botGhost.deleteFile(this.modelsDir, model.fileName))
      )
    }
  }

  async persistModels(models: Model[]) {
    await Promise.map(models, model => this._persistModel(model))
    return this._cleanupModels()
  }

  private async _getAvailableModels(includeGlobalModels: boolean = false): Promise<ModelMeta[]> {
    const botModels = await this.botGhost.directoryListing(this.modelsDir, '*.+(bin|vec)')
    const globalModels = includeGlobalModels
      ? await this.globalGhost.directoryListing(this.modelsDir, '*.+(bin|vec)')
      : []

    return [...botModels, ...globalModels]
      .map(x => {
        const fileName = path.basename(x)
        const parts = fileName.replace(/\.(bin|vec)$/i, '').split('__')

        if (parts.length !== 4) {
          // we don't support legacy format (old models)
          // this is non-breaking as it will simply re-train the models
          // DEPRECATED – REMOVED THIS CONDITION IN BP > 11
          return undefined
        }

        return {
          fileName,
          context: parts[0],
          created_on: parseInt(parts[1]) || 0,
          hash: parts[2],
          type: parts[3],
          scope: globalModels.includes(x) ? 'global' : 'bot'
        }
      })
      .filter(x => !!x)
  }

  async modelExists(modelHash: string): Promise<boolean> {
    const models = await this._getAvailableModels(false)
    return !!_.find(models, m => m.hash === modelHash)
  }

  async getModelsFromHash(modelHash: string): Promise<Model[]> {
    const modelsMeta = await this._getAvailableModels(true)
    return Promise.map(modelsMeta.filter(meta => meta.hash === modelHash || meta.scope === 'global'), async meta => {
      const ghostDriver = meta.scope === 'global' ? this.globalGhost : this.botGhost
      return {
        meta,
        model: await ghostDriver.readFileAsBuffer(this.modelsDir, meta.fileName!)
      }
    })
  }
}
