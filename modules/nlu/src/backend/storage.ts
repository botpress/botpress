import { ScopedGhostService } from 'botpress/sdk'
import _ from 'lodash'
import path from 'path'

import { SDK } from '.'

const formatFilename = name =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9-_.]/gi, '_')
    .replace('.entities.json', '')
    .replace('.entity.json', '')
    .replace('.json', '')
    .replace('.utterances.txt', '')

export interface AvailableModel {
  created_on: Date
  hash: string
}

export default class Storage {
  private ghost: ScopedGhostService
  private intentsDir: string
  private entitiesDir: string
  private modelsDir: string

  constructor(bp: SDK, config, botId) {
    this.ghost = bp.ghost.forBot(botId)
    this.intentsDir = config.intentsDir
    this.entitiesDir = config.entitiesDir
    this.modelsDir = config.modelsDir
  }

  async saveIntent(intent, content) {
    intent = formatFilename(intent)

    if (intent.length < 1) {
      throw new Error('Invalid intent name, expected at least one character')
    }

    const utterancesFile = `${intent}.utterances.txt`
    const propertiesFile = `${intent}.json`

    const utterances = content.utterances.join('\r\n') // \n To support windows as well

    await this.ghost.upsertFile(this.intentsDir, utterancesFile, utterances)
    await this.ghost.upsertFile(
      this.intentsDir,
      propertiesFile,
      JSON.stringify({
        entities: content.entities
      })
    )
  }

  async deleteIntent(intent) {
    intent = formatFilename(intent)

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
    intent = formatFilename(intent)

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

  async getCustomEntities() {
    const entities = await this.ghost.directoryListing(this.entitiesDir, '.json')

    return Promise.mapSeries(entities, entity => this.getCustomEntity(entity))
  }

  async getCustomEntity(entity) {
    entity = formatFilename(entity)

    if (entity.length < 1) {
      throw new Error('Invalid entity name, expected at least one character')
    }

    const filename = `${entity}.entity.json`

    const definitionContent = await this.ghost.readFileAsString(this.entitiesDir, filename)
    const definition = JSON.parse(definitionContent)

    return {
      name: entity,
      definition: definition
    }
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
}
