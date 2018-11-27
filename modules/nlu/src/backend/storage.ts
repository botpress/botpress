import * as sdk from 'botpress/sdk'

import { ScopedGhostService } from 'botpress/sdk'
import _ from 'lodash'
import path from 'path'

import { Config } from '../config'

const sanitizeFilenameNoExt = name =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9-_.]/gi, '_')
    .replace('.json', '')
    .replace('.utterances.txt', '')

export interface AvailableModel {
  created_on: Date
  hash: string
}

export default class Storage {
  static ghostProvider: (botId: string) => sdk.ScopedGhostService

  private readonly ghost: ScopedGhostService
  private readonly intentsDir: string
  private readonly entitiesDir: string
  private readonly modelsDir: string

  constructor(config: Config, private readonly botId: string) {
    this.intentsDir = config.intentsDir
    this.entitiesDir = config.entitiesDir
    this.modelsDir = config.modelsDir
    this.ghost = Storage.ghostProvider(this.botId)
  }

  async saveIntent(intent: string, content: sdk.NLU.Intent) {
    intent = sanitizeFilenameNoExt(intent)

    await Promise.map(content.slots, async slot => {
      const entity = await this.ghost.readFileAsString(this.entitiesDir, `${slot.entity}.json`)
      if (!entity) {
        throw Error(`Invalid entity "${slot.entity}" doesn\'t exists`)
      }
    })

    if (intent.length < 1) {
      throw new Error('Invalid intent name, expected at least one character')
    }

    const utterancesFile = `${intent}.utterances.txt`
    const propertiesFile = `${intent}.json`

    const utterances = content.utterances && content.utterances.join('\r\n') // \n To support windows as well
    if (utterances) {
      await this.ghost.upsertFile(this.intentsDir, utterancesFile, utterances)
    }

    await this.ghost.upsertFile(this.intentsDir, propertiesFile, JSON.stringify(content))
  }

  async deleteIntent(intent) {
    intent = sanitizeFilenameNoExt(intent)

    if (intent.length < 1) {
      throw new Error('Invalid intent name, expected at least one character')
    }

    const utterancesFile = `${intent}.utterances.txt`
    const propertiesFile = `${intent}.json`

    try {
      await this.ghost.deleteFile(this.intentsDir, utterancesFile)
    } catch (e) {
      if (e.code !== 'ENOENT' && !e.message.includes("couldn't find it")) {
        throw e
      }
    }

    try {
      await this.ghost.deleteFile(this.intentsDir, propertiesFile)
    } catch (e) {
      if (e.code !== 'ENOENT' && !e.message.includes("couldn't find it")) {
        throw e
      }
    }
  }

  async getIntents() {
    const intents = await this.ghost.directoryListing(this.intentsDir, '*.json')
    return Promise.mapSeries(intents, intent => this.getIntent(intent))
  }

  async getIntent(intent) {
    intent = sanitizeFilenameNoExt(intent)

    if (intent.length < 1) {
      throw new Error('Invalid intent name, expected at least one character')
    }

    const filename = `${intent}.json`

    const propertiesContent = await this.ghost.readFileAsString(this.intentsDir, filename)
    const utterancesContent = await this.ghost.readFileAsString(
      this.intentsDir,
      filename.replace('.json', '.utterances.txt')
    )

    const utterances = _.split(utterancesContent, /\r|\r\n|\n/i).filter(x => x.length)
    const properties = JSON.parse(propertiesContent)

    return {
      name: intent,
      filename: filename,
      utterances: utterances,
      ...properties
    }
  }

  async getCustomEntities(): Promise<sdk.NLU.Entity[]> {
    return [] // TODO: Extract custom entities here
  }

  async saveEntity(entity: string, content: any): Promise<void> {
    const fileName = this._getEntityFileName(entity)
    return this.ghost.upsertFile(this.entitiesDir, fileName, JSON.stringify(content))
  }

  async deleteEntity(entity: string): Promise<void> {
    const fileName = this._getEntityFileName(entity)
    return this.ghost.deleteFile(this.entitiesDir, fileName)
  }

  async persistModel(modelBuffer: Buffer, modelName: string) {
    // TODO Ghost to support streams?
    return this.ghost.upsertFile(this.modelsDir, modelName, modelBuffer)
  }

  async getAvailableModels(): Promise<AvailableModel[]> {
    const models = await this.ghost.directoryListing(this.modelsDir, '*.bin')
    return models.map(x => {
      const fileName = path.basename(x, '.bin')
      const parts = fileName.split('__')
      return <AvailableModel>{
        created_on: new Date(parts[0]),
        hash: parts[1]
      }
    })
  }

  async modelExists(modelHash: string): Promise<boolean> {
    const models = await this.getAvailableModels()
    return !!_.find(models, m => m.hash === modelHash)
  }

  async getModelAsBuffer(modelHash: string): Promise<Buffer> {
    const models = await this.ghost.directoryListing(this.modelsDir, '*.bin')
    const modelFn = _.find(models, m => m.indexOf(modelHash) !== -1)

    return this.ghost.readFileAsBuffer(this.modelsDir, modelFn)
  }

  private _getEntityFileName(entity: string) {
    entity = sanitizeFilenameNoExt(entity)
    if (entity.length < 1) {
      throw new Error('Invalid entity name, expected at least one character')
    }

    return entity + '.json'
  }
}
