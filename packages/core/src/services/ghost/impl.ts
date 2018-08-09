import path from 'path'

import {
  GhostPendingRevisions,
  GhostPendingRevisionsWithContent,
  GhostWatchFolderOptions,
  ObjectCache,
  StorageDriver
} from '.'

type TrackedFolders = { [x: string]: GhostWatchFolderOptions }

export default class GhostService {
  trackedFolders: TrackedFolders = {}

  constructor(private driver: StorageDriver, private cache: ObjectCache) {
    this.trackedFolders = {}
  }

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
    if (this.baseDir.indexOf('*') !== this.baseDir.length - 1) {
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

  async addRootFolder(rootFolder: string, options: GhostWatchFolderOptions): Promise<void> {
    this.trackedFolders[this.normalizeFolderName(rootFolder)] = options
  }

  async upsertFile(rootFolder: string, file: string, content: string | Buffer): Promise<void> {
    if (this.isDirectoryGlob) {
      throw new Error(`Ghost can't read or write under this scope`)
    }

    const fileName = this.normalizeFileName(rootFolder, file)

    await this.driver.upsertFile(fileName, content)
    await this.cache.invalidate(fileName)
  }

  async readFile<T>(rootFolder: string, file: string): Promise<Buffer | T> {
    if (this.isDirectoryGlob) {
      throw new Error(`Ghost can't read or write under this scope`)
    }

    const folderName = this.normalizeFolderName(rootFolder)
    const fileName = this.normalizeFileName(rootFolder, file)
    const options = this.trackedFolders[folderName]

    const content = await this.driver.readFile(fileName)

    if (options && options.isBinary) {
      await this.cache.set<Buffer>(fileName, content)
      return content
    }

    const obj = <T>JSON.parse(content.toString())
    await this.cache.set<T>(fileName, obj)
    return obj
  }

  async deleteFile(rootFolder: string, file: string): Promise<void> {
    if (this.isDirectoryGlob) {
      throw new Error(`Ghost can't read or write under this scope`)
    }

    const fileName = this.normalizeFileName(rootFolder, file)
    await this.driver.deleteFile(fileName)
    await this.cache.invalidate(fileName)
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
