import { inject, injectable } from 'inversify'
import _ from 'lodash'
import path from 'path'

import { TYPES } from '../../misc/types'

import {
  GhostPendingRevisions,
  GhostPendingRevisionsWithContent,
  GhostWatchFolderOptions,
  ObjectCache,
  StorageDriver
} from '.'

class TrackedFolders {
  private folders = {}

  addRootFolder(rootFolder: string, options: GhostWatchFolderOptions) {
    if (this.folders[rootFolder]) {
      throw new Error(`The folder "${rootFolder}" is already tracked`)
    }

    this.folders[rootFolder] = options
  }

  getOptionsForFolder(rootFolder: string): GhostWatchFolderOptions {
    return this.folders[rootFolder]
  }

  getOptionsForFile(filePath: string): GhostWatchFolderOptions {
    const candidates = Object.keys(this.folders).filter(x => {
      // TODO This will not work with rootFolders with an '*' in their path
      return filePath.startsWith(x)
    })

    if (!candidates.length) {
      throw new Error(`File "${filePath}" does not seem to be tracked by the Ghost Service`)
    }

    const mostPrecise = _.orderBy(candidates, x => x.length, 'desc')
    return this.folders[mostPrecise[0]]
  }
}

@injectable()
export default class GhostService {
  trackedFolders: TrackedFolders = new TrackedFolders()

  constructor(
    @inject(TYPES.StorageDriver) private driver: StorageDriver,
    @inject(TYPES.ObjectCache) private cache: ObjectCache
  ) {}

  global(): ScoppedGhostService {
    return new ScoppedGhostService(`./data/global`, this.driver, this.trackedFolders, this.cache)
  }

  forBot(botId: string): ScoppedGhostService {
    if (botId.includes('*') || botId.includes('.')) {
      throw new Error(`botId can't contain special chars like '*' and '.'`)
    }

    return new ScoppedGhostService(`./data/bots/${botId}`, this.driver, this.trackedFolders, this.cache)
  }

  forAllBots(): ScoppedGhostService {
    return new ScoppedGhostService(`./data/bots/*`, this.driver, this.trackedFolders, this.cache)
  }
}

export class ScoppedGhostService {
  isDirectoryGlob: boolean

  constructor(
    private baseDir: string,
    private driver: StorageDriver,
    private trackedFolders: TrackedFolders,
    private cache: ObjectCache
  ) {
    if (![-1, this.baseDir.length - 1].includes(this.baseDir.indexOf('*'))) {
      throw new Error(`Base directory can only contain '*' at the end of the path`)
    }

    this.isDirectoryGlob = this.baseDir.endsWith('*')
  }

  private normalizeFolderName(rootFolder: string) {
    return path.join(this.baseDir, rootFolder)
  }

  private normalizeFileName(rootFolder: string, file: string) {
    return path.join(this.normalizeFolderName(rootFolder), file)
  }

  async addRootFolder(rootFolder: string, options?: GhostWatchFolderOptions): Promise<void> {
    this.trackedFolders.addRootFolder(this.normalizeFolderName(rootFolder), {
      filesGlob: '*.*',
      isBinary: false,
      ...options
    })
  }

  objectCacheKey = str => `string::${str}`
  bufferCacheKey = str => `string::${str}`

  private async invalidateFile(fileName: string) {
    await this.cache.invalidate(this.objectCacheKey(fileName))
    await this.cache.invalidate(this.bufferCacheKey(fileName))
  }

  async upsertFile(rootFolder: string, file: string, content: string | Buffer): Promise<void> {
    if (this.isDirectoryGlob) {
      throw new Error(`Ghost can't read or write under this scope`)
    }

    const fileName = this.normalizeFileName(rootFolder, file)

    await this.driver.upsertFile(fileName, content)
    this.invalidateFile(fileName)
  }

  async readFileAsBuffer(rootFolder: string, file: string): Promise<Buffer> {
    if (this.isDirectoryGlob) {
      throw new Error(`Ghost can't read or write under this scope`)
    }

    const fileName = this.normalizeFileName(rootFolder, file)
    const cacheKey = this.bufferCacheKey(fileName)

    if (!(await this.cache.has(cacheKey))) {
      const value = await this.driver.readFile(fileName)
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
    await this.driver.deleteFile(fileName)
    await this.invalidateFile(fileName)
  }

  async directoryListing(rootFolder: string, fileEndingPattern: string, pathsToOmit?: string[]): Promise<string[]> {
    const files = await this.driver.directoryListing(this.normalizeFolderName(rootFolder), fileEndingPattern)

    if (pathsToOmit) {
      return files.filter(path => !pathsToOmit.includes(path))
    } else {
      return files
    }
  }

  getPending(): Promise<GhostPendingRevisions> {
    throw new Error('Not implemented')
  }

  getPendingWithContent(options: { stringifyBinary: boolean }): Promise<GhostPendingRevisionsWithContent> {
    throw new Error('Not implemented')
  }
}
