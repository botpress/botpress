import * as sdk from 'botpress/sdk'
import { ScopedGhostService } from 'botpress/sdk'
import _ from 'lodash'
import path from 'path'

import { Config } from '../config'
import { sanitizeFilenameNoExt } from '../util'

import { Result } from './tools/five-fold'
import { Model, ModelMeta } from './typings'

const N_KEEP_MODELS = 25

export default class Storage {
  static ghostProvider: (botId?: string) => sdk.ScopedGhostService

  private readonly botGhost: ScopedGhostService
  private readonly globalGhost: ScopedGhostService
  private readonly intentsDir: string = './intents'
  private readonly entitiesDir: string = './entities'
  private readonly modelsDir: string = './models'
  private readonly config: Config

  constructor(
    config: Config,
    private readonly botId: string,
    private readonly defaultLanguage: string,
    private readonly languages: string[],
    private readonly logger: sdk.Logger
  ) {
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

  async updateIntent(intentName: string, content: Partial<sdk.NLU.IntentDefinition>) {
    const intentDef = await this.getIntent(intentName)
    const merged = _.merge(intentDef, content)

    return this.saveIntent(intentName, merged)
  }

  async saveConfusionMatrix({
    modelHash,
    lang,
    results,
    confusionVersion
  }: {
    modelHash: string
    lang: string
    results: Result
    confusionVersion: string
  }) {
    const fileName = `confusion__${modelHash}__${confusionVersion}.json`
    await this.botGhost.upsertFile(`${this.modelsDir}/${lang}`, `${fileName}`, JSON.stringify(results, undefined, 2))
  }

  getAllConfusionMatrix = async (): Promise<{ lang: string; matrix: Result }[]> =>
    await Promise.all(
      (await this.botGhost.directoryListing(this.modelsDir, '*.json')).map(async path => {
        const [lang, file] = path.split('/')
        const [_, hash, rest] = file.split('__')

        return {
          version: rest.split('.')[0],
          hash: hash,
          lang,
          matrix: await this.botGhost.readFileAsObject<Result>(`${this.modelsDir}/${lang}`, file)
        }
      })
    )

  async getConfusionMatrix(modelHash: string, buildVersion: string, lang: string): Promise<Result> {
    return await this.botGhost.readFileAsObject<Result>(
      `${this.modelsDir}/${lang}`,
      `confusion__${modelHash}__${buildVersion}.json`
    )
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
    const intentsName = await this.botGhost.directoryListing(this.intentsDir, '*.json')

    const intents = await Promise.mapSeries(intentsName, name =>
      this.getIntent(name).catch(err => {
        this.logger.attachError(err).error(`An error occured while loading ${name}`)
      })
    )

    return _.reject(intents, _.isEmpty)
  }

  async getIntent(intent: string): Promise<sdk.NLU.IntentDefinition> {
    intent = sanitizeFilenameNoExt(intent)

    if (intent.length < 1) {
      throw new Error('Invalid intent name, expected at least one character')
    }

    const filename = `${intent}.json`
    const jsonContent = await this.botGhost.readFileAsString(this.intentsDir, filename).catch(err => {
      this.logger.attachError(err).error(`An error occured while loading ${intent}`)
    })

    try {
      if (jsonContent) {
        const content = JSON.parse(jsonContent)
        return this._migrate_intentDef_11_12(intent, filename, content)
      }
    } catch (err) {
      throw new Error(
        `Could not parse intent properties (invalid JSON, enable NLU errors for more information). JSON = "${jsonContent}" in file "${filename}"`
      )
    }
  }

  /**
   * @deprecated > 12
   * Graceful migration
   */
  private async _migrate_intentDef_11_12(
    intentName: string,
    filename: string,
    oldIntent: any
  ): Promise<sdk.NLU.IntentDefinition> {
    let hasChange = false
    const intentDef = {
      name: intentName,
      filename: filename,
      contexts: ['global'],
      ...oldIntent
    }

    // add slots
    for (const slot of intentDef.slots || []) {
      if (!slot.entities && slot.entity) {
        slot.entities = [slot.entity]
        delete slot.entity
        hasChange = true
      }
    }

    // add multilang utterances
    if (_.isArray(intentDef.utterances)) {
      hasChange = true
      const getTranslatedUtterances = lang => (lang === this.defaultLanguage ? intentDef.utterances : [])

      intentDef.utterances = this.languages.reduce(
        (utt, lang) => ({
          ...utt,
          [lang]: getTranslatedUtterances(lang)
        }),
        {}
      )
    }

    if (hasChange) {
      await this.saveIntent(intentName, intentDef)
    }

    return intentDef
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
          'number',
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

  private async _persistModel(model: Model, lang: string) {
    // TODO Ghost to support streams?
    const modelName = `${model.meta.context}__${model.meta.created_on}__${model.meta.hash}__${model.meta.type}.bin`
    const modelDir = `${this.modelsDir}/${lang}`

    return this.botGhost.upsertFile(modelDir, modelName, model.model)
  }

  private async _cleanupModels(lang: string): Promise<void> {
    const models = await this._getAvailableModels(false, lang)
    const uniqModelMeta = _.chain(models)
      .orderBy('created_on', 'desc')
      .uniqBy('hash')
      .value()

    if (uniqModelMeta.length > N_KEEP_MODELS) {
      const threshModel = uniqModelMeta[N_KEEP_MODELS - 1]
      await Promise.all(
        models
          .filter(model => model.created_on < threshModel.created_on && model.hash !== threshModel.hash)
          .map(model => this.botGhost.deleteFile(`${this.modelsDir}/${lang}`, model.fileName))
      )
    }
  }

  async persistModels(models: Model[], lang: string) {
    await Promise.map(models, model => this._persistModel(model, lang))
    return this._cleanupModels(lang)
  }

  private async _getAvailableModels(includeGlobalModels: boolean, lang: string): Promise<ModelMeta[]> {
    const modelDir = `${this.modelsDir}/${lang}`
    const botModels = await this.botGhost.directoryListing(modelDir, '*.+(bin|vec)')

    const globalModels = includeGlobalModels ? await this.globalGhost.directoryListing(modelDir, '*.+(bin|vec)') : []

    return [...botModels, ...globalModels]
      .map(x => {
        const fileName = path.basename(x)
        const parts = fileName.replace(/\.(bin|vec)$/i, '').split('__')

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

  async modelExists(modelHash: string, lang: string): Promise<boolean> {
    const models = await this._getAvailableModels(false, lang)
    return !!_.find(models, m => m.hash === modelHash)
  }

  async getModelsFromHash(modelHash: string, lang: string): Promise<Model[]> {
    const modelsMeta = await this._getAvailableModels(true, lang)

    return Promise.map(modelsMeta.filter(meta => meta.hash === modelHash || meta.scope === 'global'), async meta => {
      const ghostDriver = meta.scope === 'global' ? this.globalGhost : this.botGhost

      return {
        meta,
        model: await ghostDriver.readFileAsBuffer(`${this.modelsDir}/${lang}`, meta.fileName!)
      }
    })
  }
}
