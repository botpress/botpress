import mkdirp from 'mkdirp'
import path from 'path'
import _ from 'lodash'
import Promise from 'bluebird'

const formatFilename = name =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9-_.]/gi, '_')
    .replace('.entities.json', '')
    .replace('.entity.json', '')
    .replace('.json', '')
    .replace('.utterances.txt', '')

export default class Storage {
  constructor({ bp, config, provider }) {
    this.ghost = bp.ghostManager
    this.intentsDir = config.intentsDir
    this.entitiesDir = config.entitiesDir
    this.projectDir = bp.projectLocation
    this.provider = provider
  }

  async initializeGhost() {
    mkdirp.sync(path.resolve(this.projectDir, this.intentsDir))
    mkdirp.sync(path.resolve(this.projectDir, this.entitiesDir))

    await this.ghost.addRootFolder(this.intentsDir, { filesGlob: '**/*.*' })
    await this.ghost.addRootFolder(this.entitiesDir, { filesGlob: '**/*.entity.json' })
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
    const intents = await this.ghost.directoryListing(this.intentsDir, '.json')
    return Promise.mapSeries(intents, intent => this.getIntent(intent))
  }

  async getIntent(intent) {
    intent = formatFilename(intent)

    if (intent.length < 1) {
      throw new Error('Invalid intent name, expected at least one character')
    }

    const filename = `${intent}.json`

    const propertiesContent = await this.ghost.readFile(this.intentsDir, filename)
    const utterancesContent = await this.ghost.readFile(this.intentsDir, filename.replace('.json', '.utterances.txt'))

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

    const definitionContent = await this.ghost.readFile(this.entitiesDir, filename)
    const definition = JSON.parse(definitionContent)

    return {
      name: entity,
      definition: definition
    }
  }
}
