import { ListenHandle, Logger } from 'botpress/sdk'
import { ObjectCache } from 'common/object-cache'
import { isValidBotId } from 'common/validation'
import { asBytes, forceForwardSlashes } from 'core/misc/utils'
import { EventEmitter2 } from 'eventemitter2'
import fse from 'fs-extra'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'
import minimatch from 'minimatch'
import mkdirp from 'mkdirp'
import path from 'path'
import replace from 'replace-in-file'
import tmp from 'tmp'
import { VError } from 'verror'

import { createArchive } from '../../misc/archive'
import { TYPES } from '../../types'

import { PendingRevisions, ReplaceContent, ServerWidePendingRevisions, StorageDriver } from '.'
import DBStorageDriver from './db-driver'
import DiskStorageDriver from './disk-driver'

const MAX_GHOST_FILE_SIZE = asBytes('100mb')

@injectable()
export class GhostService {
  private _scopedGhosts: Map<string, ScopedGhostService> = new Map()
  public enabled: boolean = false

  constructor(
    @inject(TYPES.DiskStorageDriver) private diskDriver: DiskStorageDriver,
    @inject(TYPES.DBStorageDriver) private dbDriver: DBStorageDriver,
    @inject(TYPES.ObjectCache) private cache: ObjectCache,
    @inject(TYPES.Logger)
    @tagged('name', 'GhostService')
    private logger: Logger
  ) {}

  initialize(enabled: boolean) {
    this.enabled = enabled
  }

  global(): ScopedGhostService {
    return new ScopedGhostService(
      `./data/global`,
      this.diskDriver,
      this.dbDriver,
      this.enabled,
      this.cache,
      this.logger
    )
  }

  bots(): ScopedGhostService {
    return new ScopedGhostService(`./data/bots`, this.diskDriver, this.dbDriver, this.enabled, this.cache, this.logger)
  }

  forBot(botId: string): ScopedGhostService {
    if (!isValidBotId(botId)) {
      throw new Error(`Invalid botId "${botId}"`)
    }

    if (this._scopedGhosts.has(botId)) {
      return this._scopedGhosts.get(botId)!
    }

    const scopedGhost = new ScopedGhostService(
      `./data/bots/${botId}`,
      this.diskDriver,
      this.dbDriver,
      this.enabled,
      this.cache,
      this.logger
    )

    const listenForUnmount = args => {
      if (args && args.botId === botId) {
        scopedGhost.events.removeAllListeners()
      } else {
        process.BOTPRESS_EVENTS.once('after_bot_unmount', listenForUnmount)
      }
    }
    listenForUnmount({})

    this._scopedGhosts.set(botId, scopedGhost)
    return scopedGhost
  }

  public async exportArchive(botIds: string[]): Promise<Buffer> {
    const tmpDir = tmp.dirSync({ unsafeCleanup: true })
    const files: string[] = []

    try {
      await mkdirp.sync(path.join(tmpDir.name, 'global'))
      const outDir = path.join(tmpDir.name, 'global')
      const outFiles = (await this.global().exportToDirectory(outDir)).map(f => path.join('global', f))
      files.push(...outFiles)

      await Promise.mapSeries(botIds, async bid => {
        const p = path.join(tmpDir.name, `bots/${bid}`)
        await mkdirp.sync(p)
        const outFiles = (await this.forBot(bid).exportToDirectory(p)).map(f => path.join(`bots/${bid}`, f))
        files.push(...outFiles)
      })

      const filename = path.join(tmpDir.name, 'archive.tgz')
      const archive = await createArchive(filename, tmpDir.name, files)
      return await fse.readFile(archive)
    } finally {
      tmpDir.removeCallback()
    }
  }

  public async getPending(botIds: string[]): Promise<ServerWidePendingRevisions | {}> {
    if (!this.enabled) {
      return {}
    }

    const global = await this.global().getPendingChanges()
    const bots = await Promise.mapSeries(botIds, async botId => this.forBot(botId).getPendingChanges())
    return {
      global,
      bots
    }
  }
}

export interface FileContent {
  name: string
  content: string | Buffer
}

export class ScopedGhostService {
  isDirectoryGlob: boolean
  primaryDriver: StorageDriver
  events: EventEmitter2 = new EventEmitter2()

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

  private _normalizeFolderName(rootFolder: string) {
    return forceForwardSlashes(path.join(this.baseDir, rootFolder))
  }

  private _normalizeFileName(rootFolder: string, file: string) {
    return forceForwardSlashes(path.join(this._normalizeFolderName(rootFolder), file))
  }

  objectCacheKey = str => `object::${str}`
  bufferCacheKey = str => `buffer::${str}`

  private async _invalidateFile(fileName: string) {
    await this.cache.invalidate(this.objectCacheKey(fileName))
    await this.cache.invalidate(this.bufferCacheKey(fileName))
  }

  async invalidateFile(rootFolder: string, fileName: string): Promise<void> {
    const filePath = this._normalizeFileName(rootFolder, fileName)
    await this._invalidateFile(filePath)
  }

  async ensureDirs(rootFolder: string, directories: string[]): Promise<void> {
    if (!this.useDbDriver) {
      await Promise.mapSeries(directories, d => this.diskDriver.createDir(this._normalizeFileName(rootFolder, d)))
    }
  }

  async upsertFile(rootFolder: string, file: string, content: string | Buffer, recordRevision = true): Promise<void> {
    if (this.isDirectoryGlob) {
      throw new Error(`Ghost can't read or write under this scope`)
    }

    const fileName = this._normalizeFileName(rootFolder, file)

    if (content.length > MAX_GHOST_FILE_SIZE) {
      throw new Error(`The size of the file ${fileName} is over the 100mb limit`)
    }

    await this.primaryDriver.upsertFile(fileName, content, recordRevision)
    this.events.emit('changed', fileName)
    await this._invalidateFile(fileName)
  }

  async upsertFiles(rootFolder: string, content: FileContent[]): Promise<void> {
    await Promise.all(content.map(c => this.upsertFile(rootFolder, c.name, c.content)))
  }

  /**
   * All tracked files will be synced.
   * All files are tracked by default, unless `.ghostignore` is used to exclude them.
   */
  async sync() {
    if (!this.useDbDriver) {
      // We don't have to sync anything as we're just using the files from disk
      return
    }

    // Get files from disk that should be ghosted
    const trackedFiles = await this.diskDriver.directoryListing(this.baseDir, { includeDotFiles: true })

    const diskRevs = await this.diskDriver.listRevisions(this.baseDir)
    const dbRevs = await this.dbDriver.listRevisions(this.baseDir)
    const syncedRevs = _.intersectionBy(diskRevs, dbRevs, x => `${x.path} | ${x.revision}`)

    await Promise.each(syncedRevs, rev => this.dbDriver.deleteRevision(rev.path, rev.revision))

    if (!(await this.isFullySynced())) {
      const scUrl = `/admin/settings/version`
      this.logger.warn(
        `You have changes on your production environment that aren't synced on your local file system. Visit '${scUrl}' to save changes back to your Source Control.`
      )
      return
    }

    // Delete the ghosted files that has been deleted from disk
    const ghostedFiles = await this.dbDriver.directoryListing(this._normalizeFolderName('./'))
    const filesToDelete = _.difference(ghostedFiles, trackedFiles)
    await Promise.map(filesToDelete, filePath =>
      this.dbDriver.deleteFile(this._normalizeFileName('./', filePath), false)
    )

    // Overwrite all of the ghosted files with the tracked files
    await Promise.each(trackedFiles, async file => {
      const filePath = this._normalizeFileName('./', file)
      const content = await this.diskDriver.readFile(filePath)
      await this.dbDriver.upsertFile(filePath, content, false)
    })
  }

  public async exportToDirectory(directory: string, exludes?: string | string[]): Promise<string[]> {
    const allFiles = await this.directoryListing('./', '*.*', exludes, true)

    for (const file of allFiles.filter(x => x !== 'revisions.json')) {
      const content = await this.primaryDriver.readFile(this._normalizeFileName('./', file))
      const outPath = path.join(directory, file)
      mkdirp.sync(path.dirname(outPath))
      await fse.writeFile(outPath, content)
    }

    const oldRevisions = await this.diskDriver.listRevisions(this.baseDir)
    const newRevisions = await this.dbDriver.listRevisions(this.baseDir)
    const mergedRevisions = _.unionBy(oldRevisions, newRevisions, x => x.path + ' ' + x.revision)

    await fse.writeFile(path.join(directory, 'revisions.json'), JSON.stringify(mergedRevisions, undefined, 2))
    if (!allFiles.includes('revisions.json')) {
      allFiles.push('revisions.json')
    }

    return allFiles
  }

  public async importFromDirectory(directory: string) {
    const filenames = await this.diskDriver.absoluteDirectoryListing(directory)

    const files = filenames.map(file => {
      return {
        name: file,
        content: fse.readFileSync(path.join(directory, file))
      } as FileContent
    })

    await this.upsertFiles('/', files)
  }

  public async exportToArchiveBuffer(exludes?: string | string[], replaceContent?: ReplaceContent): Promise<Buffer> {
    const tmpDir = tmp.dirSync({ unsafeCleanup: true })

    try {
      const outFiles = await this.exportToDirectory(tmpDir.name, exludes)
      if (replaceContent) {
        await replace({ files: `${tmpDir.name}/**/*.json`, from: replaceContent.from, to: replaceContent.to })
      }

      const filename = path.join(tmpDir.name, 'archive.tgz')

      const archive = await createArchive(filename, tmpDir.name, outFiles)
      return await fse.readFile(archive)
    } finally {
      tmpDir.removeCallback()
    }
  }

  public async isFullySynced(): Promise<boolean> {
    if (!this.useDbDriver) {
      return true
    }

    const revisions = await this.dbDriver.listRevisions(this.baseDir)
    return revisions.length === 0
  }

  async readFileAsBuffer(rootFolder: string, file: string): Promise<Buffer> {
    if (this.isDirectoryGlob) {
      throw new Error(`Ghost can't read or write under this scope`)
    }

    const fileName = this._normalizeFileName(rootFolder, file)
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
    const fileName = this._normalizeFileName(rootFolder, file)
    const cacheKey = this.objectCacheKey(fileName)

    if (!(await this.cache.has(cacheKey))) {
      const value = await this.readFileAsString(rootFolder, file)
      const obj = <T>JSON.parse(value)
      await this.cache.set(cacheKey, obj)
      return obj
    }

    return this.cache.get<T>(cacheKey)
  }

  async fileExists(rootFolder: string, file: string): Promise<boolean> {
    const fileName = this._normalizeFileName(rootFolder, file)
    try {
      await this.primaryDriver.readFile(fileName)
      return true
    } catch (err) {
      return false
    }
  }

  async deleteFile(rootFolder: string, file: string): Promise<void> {
    if (this.isDirectoryGlob) {
      throw new Error(`Ghost can't read or write under this scope`)
    }

    const fileName = this._normalizeFileName(rootFolder, file)
    await this.primaryDriver.deleteFile(fileName, true)
    this.events.emit('changed', fileName)
    await this._invalidateFile(fileName)
  }

  async renameFile(rootFolder: string, fromName: string, toName: string): Promise<void> {
    const fromPath = this._normalizeFileName(rootFolder, fromName)
    const toPath = this._normalizeFileName(rootFolder, toName)

    await this.primaryDriver.moveFile(fromPath, toPath)
  }

  async deleteFolder(folder: string): Promise<void> {
    if (this.isDirectoryGlob) {
      throw new Error(`Ghost can't read or write under this scope`)
    }

    const folderName = this._normalizeFolderName(folder)
    await this.primaryDriver.deleteDir(folderName)
  }

  async directoryListing(
    rootFolder: string,
    fileEndingPattern: string = '*.*',
    excludes?: string | string[],
    includeDotFiles?: boolean
  ): Promise<string[]> {
    try {
      const files = await this.primaryDriver.directoryListing(this._normalizeFolderName(rootFolder), {
        excludes,
        includeDotFiles
      })

      return (files || []).filter(
        minimatch.filter(fileEndingPattern, { matchBase: true, nocase: true, noglobstar: false, dot: includeDotFiles })
      )
    } catch (err) {
      if (err && err.message && err.message.includes('ENOENT')) {
        return []
      }
      throw new VError(err, `Could not list directory under ${rootFolder}`)
    }
  }

  async getPendingChanges(): Promise<PendingRevisions> {
    if (!this.useDbDriver) {
      return {}
    }

    const revisions = await this.dbDriver.listRevisions(this.baseDir)
    const result: PendingRevisions = {}

    for (const revision of revisions) {
      const rPath = path.relative(this.baseDir, revision.path)
      const folder = rPath.includes(path.sep) ? rPath.substr(0, rPath.indexOf(path.sep)) : 'root'

      if (!result[folder]) {
        result[folder] = []
      }

      result[folder].push(revision)
    }

    return result
  }

  onFileChanged(callback: (filePath: string) => void): ListenHandle {
    const cb = file => callback && callback(file)
    this.events.on('changed', cb)
    return { remove: () => this.events.off('changed', cb) }
  }
}
