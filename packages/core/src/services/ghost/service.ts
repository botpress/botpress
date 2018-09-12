import { Logger } from 'botpress-module-sdk'
import { inject, injectable, postConstruct, tagged } from 'inversify'
import _ from 'lodash'
import minimatch from 'minimatch'
import path from 'path'

import { BotpressConfig } from '../../config/botpress.config'
import { TYPES } from '../../misc/types'
import { isValidBotId } from '../../misc/validation'

import { GhostPendingRevisions, GhostPendingRevisionsWithContent, ObjectCache, StorageDriver } from '.'
import DBStorageDriver from './db-driver'
import DiskStorageDriver from './disk-driver'

@injectable()
export default class GhostService {
  config: Partial<BotpressConfig> | undefined

  private get useDBDriver() {
    return _.get(this.config, 'ghost.enabled', false)
  }

  constructor(
    @inject(TYPES.DiskStorageDriver) private diskDriver: DiskStorageDriver,
    @inject(TYPES.DBStorageDriver) private dbDriver: DBStorageDriver,
    @inject(TYPES.ObjectCache) private cache: ObjectCache,
    @inject(TYPES.Logger)
    @tagged('name', 'GhostService')
    private logger: Logger
  ) {}

  async initialize(config: Partial<BotpressConfig>) {
    this.config = config
  }

  global(): ScopedGhostService {
    return new ScopedGhostService(
      `./data/global`,
      this.diskDriver,
      this.dbDriver,
      this.useDBDriver,
      this.cache,
      this.logger
    )
  }

  forBot(botId: string): ScopedGhostService {
    if (!isValidBotId(botId)) {
      throw new Error(`Invalid botId "${botId}"`)
    }

    return new ScopedGhostService(
      `./data/bots/${botId}`,
      this.diskDriver,
      this.dbDriver,
      this.useDBDriver,
      this.cache,
      this.logger
    )
  }
}

export class ScopedGhostService {
  isDirectoryGlob: boolean
  primaryDriver: StorageDriver

  constructor(
    private baseDir: string,
    private diskDriver: DiskStorageDriver,
    private dbDriver: DBStorageDriver,
    private useDbDriver: boolean,
    private cache: ObjectCache,
    private logger: Logger
  ) {
    if (![-1, this.baseDir.length - 1].includes(this.baseDir.indexOf('*'))) {
      throw new Error(`Base directory can only contain '*' at the end of the path`)
    }

    this.isDirectoryGlob = this.baseDir.endsWith('*')
    this.primaryDriver = useDbDriver ? dbDriver : diskDriver
  }

  private normalizeFolderName(rootFolder: string) {
    return path.join(this.baseDir, rootFolder)
  }

  private normalizeFileName(rootFolder: string, file: string) {
    return path.join(this.normalizeFolderName(rootFolder), file)
  }

  objectCacheKey = str => `string::${str}`
  bufferCacheKey = str => `buffer::${str}`

  private async invalidateFile(fileName: string) {
    await this.cache.invalidate(this.objectCacheKey(fileName))
    await this.cache.invalidate(this.bufferCacheKey(fileName))
  }

  async upsertFile(rootFolder: string, file: string, content: string | Buffer): Promise<void> {
    if (this.isDirectoryGlob) {
      throw new Error(`Ghost can't read or write under this scope`)
    }

    const fileName = this.normalizeFileName(rootFolder, file)

    await this.primaryDriver.upsertFile(fileName, content, true)
    this.invalidateFile(fileName)
  }

  async sync(paths: string[]) {
    if (!this.useDbDriver) {
      // We don't have to sync anything as we're just using the files from disk
      return
    }

    const diskRevs = await this.diskDriver.listRevisionIds(this.baseDir)
    const dbRevs = await this.dbDriver.listRevisionIds(this.baseDir)
    const syncedRevs = _.union(diskRevs, dbRevs)
    await this.dbDriver.deleteRevisions(syncedRevs)

    if (!(await this.isFullySynced())) {
      this.logger.warn(`Found unsynced file changes in "${this.baseDir}"`)
      return
    }

    for (const path of paths) {
      const currentFiles = await this.dbDriver.directoryListing(this.normalizeFolderName(path))
      const newFiles = await this.diskDriver.directoryListing(this.normalizeFolderName(path))

      // We delete files that have been deleted from disk
      for (const file of _.difference(currentFiles, newFiles)) {
        const filePath = this.normalizeFileName(path, file)
        await this.dbDriver.deleteFile(filePath, false)
      }

      // We now update files in DB by those on the disk
      for (const file of newFiles) {
        const filePath = this.normalizeFileName(path, file)
        const content = await this.diskDriver.readFile(filePath)
        await this.dbDriver.upsertFile(filePath, content, false)
      }
    }
  }

  public async isFullySynced(): Promise<boolean> {
    if (!this.useDbDriver) {
      return true
    }

    const revisions = await this.dbDriver.listRevisionIds(this.baseDir)
    return revisions.length === 0
  }

  async readFileAsBuffer(rootFolder: string, file: string): Promise<Buffer> {
    if (this.isDirectoryGlob) {
      throw new Error(`Ghost can't read or write under this scope`)
    }

    const fileName = this.normalizeFileName(rootFolder, file)
    const cacheKey = this.bufferCacheKey(fileName)

    if (!(await this.cache.has(cacheKey))) {
      const value = await this.primaryDriver.readFile(fileName)
      await this.cache.set(cacheKey, value)
      return value
    }

    return this.cache.get<Buffer>(cacheKey)
  }

  async readFileAsString(rootFolder: string, file: string): Promise<string> {
    return (await this.readFileAsBuffer(rootFolder, file)).toString()
  }

  async readFileAsObject<T>(rootFolder: string, file: string): Promise<T> {
    const fileName = this.normalizeFileName(rootFolder, file)
    const cacheKey = this.objectCacheKey(fileName)

    if (!(await this.cache.has(cacheKey))) {
      const value = await this.readFileAsString(rootFolder, file)
      const obj = <T>JSON.parse(value)
      await this.cache.set(cacheKey, obj)
      return obj
    }

    return this.cache.get<T>(cacheKey)
  }

  async deleteFile(rootFolder: string, file: string): Promise<void> {
    if (this.isDirectoryGlob) {
      throw new Error(`Ghost can't read or write under this scope`)
    }

    const fileName = this.normalizeFileName(rootFolder, file)
    await this.primaryDriver.deleteFile(fileName, true)
    await this.invalidateFile(fileName)
  }

  async directoryListing(rootFolder: string, fileEndingPattern: string = '*.*'): Promise<string[]> {
    try {
      const files = await this.primaryDriver.directoryListing(this.normalizeFolderName(rootFolder))
      return files.filter(minimatch.filter(fileEndingPattern, { matchBase: true, nocase: true, noglobstar: false }))
    } catch (err) {
      this.logger.error(`Could not list directory under ${rootFolder}. ${err}`)
    }
    return []
  }

  async getPending(): Promise<GhostPendingRevisions> {
    if (!this.useDbDriver) {
      return {}
    }

    // get pending revisions
    // get pending revisions with content
    throw new Error('Not implemented')
  }

  async getPendingWithContent(options: { stringifyBinary: boolean }): Promise<GhostPendingRevisionsWithContent> {
    if (!this.useDbDriver) {
      return {}
    }

    throw new Error('Not implemented')
  }
}
