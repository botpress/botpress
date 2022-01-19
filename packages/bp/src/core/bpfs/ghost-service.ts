import { DirectoryListingOptions, ListenHandle, Logger, UpsertOptions } from 'botpress/sdk'
import { ObjectCache } from 'common/object-cache'
import { isValidBotId } from 'common/validation'
import { TYPES } from 'core/app/types'
import { BotConfig } from 'core/config'
import { createArchive } from 'core/misc/archive'
import { asBytes, filterByGlobs, forceForwardSlashes, sanitize } from 'core/misc/utils'
import { diffLines } from 'diff'
import { EventEmitter2 } from 'eventemitter2'
import fse from 'fs-extra'
import { inject, injectable, tagged } from 'inversify'
import jsonlintMod from 'jsonlint-mod'
import _ from 'lodash'
import minimatch from 'minimatch'
import mkdirp from 'mkdirp'
import path from 'path'
import replace from 'replace-in-file'
import tmp, { file } from 'tmp'
import { VError } from 'verror'

import { FileRevision, PendingRevisions, ReplaceContent, ServerWidePendingRevisions, StorageDriver } from '.'
import { DBStorageDriver } from './drivers/db-driver'
import { DiskStorageDriver } from './drivers/disk-driver'

export interface BpfsScopedChange {
  // An undefined bot ID = global
  botId: string | undefined
  // The list of local files which will overwrite their remote counterpart
  localFiles: string[]
  // List of added/deleted files based on local and remote files, and differences between files from revisions
  changes: FileChange[]
}

export interface FileChange {
  path: string
  action: FileChangeAction
  add?: number
  del?: number
  sizeDiff?: number
}

export type FileChangeAction = 'add' | 'edit' | 'del'

interface ScopedGhostOptions {
  botId?: string
  // Archive upload requires the full path, including drive letter, so it should not be sanitized
  noSanitize?: boolean
}

const MAX_GHOST_FILE_SIZE = process.core_env.BP_BPFS_MAX_FILE_SIZE || '100mb'
const BP_BPFS_UPLOAD_CONCURRENCY = parseInt((process.core_env.BP_BPFS_UPLOAD_CONCURRENCY as unknown) as string) || 50
const bpfsIgnoredFiles = ['models/**', 'data/bots/*/models/**', '**/*.js.map', 'data/bots/*/libraries/node_modules/**']
const GLOBAL_GHOST_KEY = '__global__'
const BOTS_GHOST_KEY = '__bots__'
const DIFFABLE_EXTS = ['.js', '.json', '.txt', '.csv', '.yaml']

@injectable()
export class GhostService {
  private _scopedGhosts: Map<string, ScopedGhostService> = new Map()
  public useDbDriver: boolean = false

  constructor(
    @inject(TYPES.DiskStorageDriver) private diskDriver: DiskStorageDriver,
    @inject(TYPES.DBStorageDriver) private dbDriver: DBStorageDriver,
    @inject(TYPES.ObjectCache) private cache: ObjectCache,
    @inject(TYPES.Logger)
    @tagged('name', 'GhostService')
    private logger: Logger
  ) {
    this.cache.events.on && this.cache.events.on('syncDbFilesToDisk', this._onSyncReceived)
  }

  async initialize(useDbDriver: boolean, ignoreSync?: boolean) {
    this.useDbDriver = useDbDriver
    this._scopedGhosts.clear()

    const global = await this.global().directoryListing('/')

    if (useDbDriver && !ignoreSync && _.isEmpty(global)) {
      this.logger.info('Syncing data/global/ to database')
      await this.global().sync()

      this.logger.info('Syncing data/bots/ to database')
      await this.bots().sync()
    }
  }

  // Not caching this scope since it's rarely used
  root(useDbDriver?: boolean): ScopedGhostService {
    return new ScopedGhostService('./data', this.diskDriver, this.dbDriver, useDbDriver ?? this.useDbDriver, this.cache)
  }

  global(): ScopedGhostService {
    if (this._scopedGhosts.has(GLOBAL_GHOST_KEY)) {
      return this._scopedGhosts.get(GLOBAL_GHOST_KEY)!
    }

    const scopedGhost = new ScopedGhostService(
      './data/global',
      this.diskDriver,
      this.dbDriver,
      this.useDbDriver,
      this.cache
    )

    this._scopedGhosts.set(GLOBAL_GHOST_KEY, scopedGhost)
    return scopedGhost
  }

  custom(baseDir: string) {
    return new ScopedGhostService(baseDir, this.diskDriver, this.dbDriver, false, this.cache, { noSanitize: true })
  }

  // TODO: refactor this
  async forceUpdate(tmpFolder: string) {
    const invalidateFile = async (fileName: string) => {
      await this.cache.invalidate(`object::${fileName}`)
      await this.cache.invalidate(`buffer::${fileName}`)
    }

    const dbRevs = await this.dbDriver.listRevisions('data/')
    await Promise.each(dbRevs, rev => this.dbDriver.deleteRevision(rev.path, rev.revision))

    const allChanges = await this.listFileChanges(tmpFolder)
    for (const { changes, localFiles } of allChanges) {
      await Promise.map(
        changes.filter(x => x.action === 'del'),
        async file => {
          await this.dbDriver.deleteFile(file.path)
          await invalidateFile(file.path)
        },
        { concurrency: BP_BPFS_UPLOAD_CONCURRENCY }
      )

      // Upload all local files for that scope
      if (localFiles.length) {
        await Promise.map(
          localFiles,
          async filePath => {
            const content = await this.diskDriver.readFile(path.join(tmpFolder, filePath))
            await this.dbDriver.upsertFile(filePath, content, false)
            await invalidateFile(filePath)
          },
          {
            concurrency: BP_BPFS_UPLOAD_CONCURRENCY
          }
        )
      }
    }

    return allChanges.filter(x => x.localFiles.length && x.botId).map(x => x.botId)
  }

  // TODO: refactor this
  async listFileChanges(tmpFolder: string): Promise<BpfsScopedChange[]> {
    const tmpDiskGlobal = this.custom(path.resolve(tmpFolder, 'data/global'))
    const tmpDiskBot = (botId?: string) => this.custom(path.resolve(tmpFolder, 'data/bots', botId || ''))

    // We need local and remote bot ids to correctly display changes
    const remoteBotIds = (await this.bots().directoryListing('/', 'bot.config.json')).map(path.dirname)
    const localBotIds = (await tmpDiskBot().directoryListing('/', 'bot.config.json')).map(path.dirname)
    const botsIds = _.uniq([...remoteBotIds, ...localBotIds])

    const uniqueFile = file => `${file.path} | ${file.revision}`

    const getFileDiff = async (file: string): Promise<FileChange> => {
      try {
        const localFile = (await this.diskDriver.readFile(path.join(tmpFolder, file))).toString()
        const dbFile = (await this.dbDriver.readFile(file)).toString()

        const diff = diffLines(dbFile, localFile)

        return {
          path: file,
          action: 'edit' as FileChangeAction,
          add: _.sumBy(
            diff.filter(d => d.added),
            'count'
          ),
          del: _.sumBy(
            diff.filter(d => d.removed),
            'count'
          )
        }
      } catch (err) {
        // Todo better handling
        this.logger.attachError(err).error(`Error while checking diff for "${file}"`)
        return { path: file, action: 'edit' as FileChangeAction }
      }
    }

    const fileSizeDiff = async (file: string): Promise<FileChange> => {
      try {
        const localFileSize = await this.diskDriver.fileSize(path.join(tmpFolder, file))
        const dbFileSize = await this.dbDriver.fileSize(file)

        return {
          path: file,
          action: 'edit' as FileChangeAction,
          sizeDiff: Math.abs(dbFileSize - localFileSize)
        }
      } catch (err) {
        this.logger.attachError(err).error(`Error while checking file size for "${file}"`)
        return { path: file, action: 'edit' as FileChangeAction }
      }
    }

    // Adds the correct prefix to files so they are displayed correctly when reviewing changes
    const getDirectoryFullPaths = async (botId: string | undefined, ghost: ScopedGhostService) => {
      const getPath = (file: string) => (botId ? path.join('data/bots', botId, file) : path.join('data/global', file))
      const files = await ghost.directoryListing('/', '*.*', [...bpfsIgnoredFiles, '**/revisions.json'])
      return files.map(f => forceForwardSlashes(getPath(f)))
    }

    const filterRevisions = (revisions: FileRevision[]) => filterByGlobs(revisions, r => r.path, bpfsIgnoredFiles)

    const getFileChanges = async (
      botId: string | undefined,
      localGhost: ScopedGhostService,
      remoteGhost: ScopedGhostService
    ) => {
      const localRevs = filterRevisions(await localGhost.listDiskRevisions())
      const remoteRevs = filterRevisions(await remoteGhost.listDbRevisions())
      const syncedRevs = _.intersectionBy(localRevs, remoteRevs, uniqueFile)
      const unsyncedFiles = _.uniq(_.differenceBy(remoteRevs, syncedRevs, uniqueFile).map(x => x.path))

      const localFiles: string[] = await getDirectoryFullPaths(botId, localGhost)
      const remoteFiles: string[] = await getDirectoryFullPaths(botId, remoteGhost)

      const deleted = _.difference(remoteFiles, localFiles).map(x => ({ path: x, action: 'del' as FileChangeAction }))
      const added = _.difference(localFiles, remoteFiles).map(x => ({ path: x, action: 'add' as FileChangeAction }))

      const filterDeleted = file => !_.map([...deleted, ...added], 'path').includes(file)
      const filterDiffable = file => DIFFABLE_EXTS.includes(path.extname(file))

      const editedFiles = unsyncedFiles.filter(filterDeleted)
      const checkFileDiff = editedFiles.filter(filterDiffable)
      const checkFileSize = unsyncedFiles.filter(x => !checkFileDiff.includes(x))

      const edited = [
        ...(await Promise.map(checkFileDiff, getFileDiff)).filter(x => x.add !== 0 || x.del !== 0),
        ...(await Promise.map(checkFileSize, fileSizeDiff)).filter(x => x.sizeDiff !== 0)
      ]

      return {
        botId,
        changes: [...added, ...deleted, ...edited],
        localFiles
      }
    }

    const botsFileChanges = await Promise.map(botsIds, botId =>
      getFileChanges(botId, tmpDiskBot(botId), this.forBot(botId))
    )

    return [...botsFileChanges, await getFileChanges(undefined, tmpDiskGlobal, this.global())]
  }

  bots(): ScopedGhostService {
    if (this._scopedGhosts.has(BOTS_GHOST_KEY)) {
      return this._scopedGhosts.get(BOTS_GHOST_KEY)!
    }

    const scopedGhost = new ScopedGhostService(
      './data/bots',
      this.diskDriver,
      this.dbDriver,
      this.useDbDriver,
      this.cache
    )

    this._scopedGhosts.set(BOTS_GHOST_KEY, scopedGhost)
    return scopedGhost
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
      this.useDbDriver,
      this.cache,
      { botId }
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

  public async exportArchive(): Promise<Buffer> {
    const tmpDir = tmp.dirSync({ unsafeCleanup: true })

    const getFullPath = folder => path.join(tmpDir.name, folder)

    try {
      const botIds = (await this.bots().directoryListing('/', 'bot.config.json')).map(path.dirname)
      const botFiles = await Promise.mapSeries(botIds, async botId =>
        (await this.forBot(botId).exportToDirectory(getFullPath(`bots/${botId}`), bpfsIgnoredFiles)).map(f =>
          path.join(`bots/${botId}`, f)
        )
      )

      const allFiles = [
        ..._.flatten(botFiles),
        ...(await this.global().exportToDirectory(getFullPath('global'), bpfsIgnoredFiles)).map(f =>
          path.join('global', f)
        )
      ]

      const archive = await createArchive(getFullPath('archive.tgz'), tmpDir.name, allFiles)
      return await fse.readFile(archive)
    } finally {
      tmpDir.removeCallback()
    }
  }

  public async getPending(botIds: string[]): Promise<ServerWidePendingRevisions | {}> {
    if (!this.useDbDriver) {
      return {}
    }

    const global = await this.global().getPendingChanges()
    const bots = await Promise.mapSeries(botIds, async botId => this.forBot(botId).getPendingChanges())
    return {
      global,
      bots
    }
  }

  private _onSyncReceived = async (message: string) => {
    try {
      const { rootFolder, botId } = JSON.parse(message)
      if (botId) {
        await this.forBot(botId).syncDatabaseFilesToDisk(rootFolder)
      } else {
        await this.global().syncDatabaseFilesToDisk(rootFolder)
      }
    } catch (err) {
      this.logger.attachError(err).error('Could not sync files locally.')
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
    private options: ScopedGhostOptions = {
      botId: undefined,
      noSanitize: true
    }
  ) {
    if (![-1, this.baseDir.length - 1].includes(this.baseDir.indexOf('*'))) {
      throw new Error("Base directory can only contain '*' at the end of the path")
    }

    this.isDirectoryGlob = this.baseDir.endsWith('*')
    this.primaryDriver = useDbDriver ? dbDriver : diskDriver
  }

  /**
   * TODO: Refactor this on v12.1.4
   * This is a temporary workaround to lock bots marked as "locked" until modules are correctly updated.
   */
  private async _assertBotUnlocked(directory: string, file?: string) {
    if (!this.options.botId || directory.startsWith('./models')) {
      return
    }

    if (await this.fileExists('/', 'bot.config.json')) {
      const config = await this.readFileAsObject<BotConfig>('/', 'bot.config.json')
      if (config.locked) {
        throw new Error('Bot locked')
      }
    }
  }

  private _normalizeFolderName(rootFolder: string) {
    const folder = forceForwardSlashes(path.join(this.baseDir, rootFolder))
    return this.options.noSanitize ? folder : sanitize(folder, 'folder')
  }

  private _normalizeFileName(rootFolder: string, file: string) {
    const fullPath = path.join(rootFolder, file)
    const folder = this._normalizeFolderName(path.dirname(fullPath))
    return forceForwardSlashes(path.join(folder, sanitize(path.basename(fullPath))))
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

  // temporary until we implement a large file storage system
  // size is increased because NLU models are getting bigger
  private getFileSizeLimit(fileName: string): number {
    const humanSize = fileName.endsWith('.model') ? '500mb' : MAX_GHOST_FILE_SIZE
    return asBytes(humanSize)
  }

  async upsertFile(
    rootFolder: string,
    file: string,
    content: string | Buffer,
    options: UpsertOptions = {
      recordRevision: true,
      syncDbToDisk: false,
      ignoreLock: false
    }
  ): Promise<void> {
    if (!options.ignoreLock) {
      await this._assertBotUnlocked(rootFolder, file)
    }

    if (this.isDirectoryGlob) {
      throw new Error("Ghost can't read or write under this scope")
    }

    const fileName = this._normalizeFileName(rootFolder, file)
    if (content.length > this.getFileSizeLimit(fileName)) {
      throw new Error(`The size of the file ${fileName} is over the 100mb limit`)
    }

    await this.primaryDriver.upsertFile(fileName, content, !!options.recordRevision)
    this.events.emit('changed', fileName)
    await this._invalidateFile(fileName)

    if (options.syncDbToDisk) {
      await this.cache.sync(JSON.stringify({ rootFolder, botId: this.options.botId }))
    }
  }

  async upsertFiles(rootFolder: string, content: FileContent[], options?: UpsertOptions): Promise<void> {
    if (options && !options.ignoreLock) {
      await this._assertBotUnlocked(rootFolder)
    }

    await Promise.all(content.map(c => this.upsertFile(rootFolder, c.name, c.content, options)))
  }

  /**
   * Sync the local filesystem to the database.
   * All files are tracked by default, unless `.ghostignore` is used to exclude them.
   */
  async sync() {
    if (!this.useDbDriver) {
      // We don't have to sync anything as we're just using the files from disk
      return
    }

    const localFiles = await this.diskDriver.directoryListing(this.baseDir, {
      includeDotFiles: true,
      excludes: ['**/node_modules/**']
    })

    const diskRevs = await this.diskDriver.listRevisions(this.baseDir)
    const dbRevs = await this.dbDriver.listRevisions(this.baseDir)
    const syncedRevs = _.intersectionBy(diskRevs, dbRevs, x => `${x.path} | ${x.revision}`)

    await Promise.each(syncedRevs, rev => this.dbDriver.deleteRevision(rev.path, rev.revision))
    await this._updateProduction(localFiles)
  }

  private async _updateProduction(localFiles: string[]) {
    // Delete the prod files that has been deleted from disk
    const prodFiles = await this.dbDriver.directoryListing(this._normalizeFolderName('./'))
    const filesToDelete = _.difference(prodFiles, localFiles)
    await Promise.map(filesToDelete, filePath =>
      this.dbDriver.deleteFile(this._normalizeFileName('./', filePath), false)
    )

    // Overwrite all of the prod files with the local files
    await Promise.each(localFiles, async file => {
      const filePath = this._normalizeFileName('./', file)
      const content = await this.diskDriver.readFile(filePath)
      await this.dbDriver.upsertFile(filePath, content, false)
    })
  }

  public async exportToDirectory(directory: string, excludes?: string | string[]): Promise<string[]> {
    const allFiles = await this.directoryListing('./', '*.*', excludes, true)

    for (const file of allFiles.filter(x => x !== 'revisions.json')) {
      const content = await this.primaryDriver.readFile(this._normalizeFileName('./', file))
      const outPath = path.join(directory, file)
      mkdirp.sync(path.dirname(outPath))
      await fse.writeFile(outPath, content)
    }

    const dbRevs = await this.dbDriver.listRevisions(this.baseDir)

    await fse.writeFile(path.join(directory, 'revisions.json'), JSON.stringify(dbRevs, undefined, 2))
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

    await this.upsertFiles('/', files, { ignoreLock: true })
  }

  public async exportToArchiveBuffer(excludes?: string | string[], replaceContent?: ReplaceContent): Promise<Buffer> {
    const tmpDir = tmp.dirSync({ unsafeCleanup: true })

    try {
      const outFiles = await this.exportToDirectory(tmpDir.name, excludes)
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
      throw new Error("Ghost can't read or write under this scope")
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
      let obj
      try {
        obj = <T>JSON.parse(value)
      } catch (e) {
        try {
          jsonlintMod.parse(value)
        } catch (e) {
          throw new Error(`SyntaxError in your JSON: ${file}: \n ${e}`)
        }
      }
      await this.cache.set(cacheKey, obj)
      return obj
    }

    return this.cache.get<T>(cacheKey)
  }

  async fileExists(rootFolder: string, file: string): Promise<boolean> {
    const fileName = this._normalizeFileName(rootFolder, file)
    const cacheKey = this.objectCacheKey(fileName)

    try {
      if (await this.cache.has(cacheKey)) {
        return true
      }

      return this.primaryDriver.fileExists(fileName)
    } catch (err) {
      return false
    }
  }

  async deleteFile(rootFolder: string, file: string): Promise<void> {
    await this._assertBotUnlocked(rootFolder, file)
    if (this.isDirectoryGlob) {
      throw new Error("Ghost can't read or write under this scope")
    }

    const fileName = this._normalizeFileName(rootFolder, file)
    await this.primaryDriver.deleteFile(fileName, true)
    this.events.emit('changed', fileName)
    await this._invalidateFile(fileName)
  }

  async renameFile(rootFolder: string, fromName: string, toName: string): Promise<void> {
    await this._assertBotUnlocked(rootFolder, fromName)
    const fromPath = this._normalizeFileName(rootFolder, fromName)
    const toPath = this._normalizeFileName(rootFolder, toName)

    await this.primaryDriver.moveFile(fromPath, toPath)
  }

  async syncDatabaseFilesToDisk(rootFolder: string): Promise<void> {
    if (!this.useDbDriver) {
      return
    }

    const remoteFiles = await this.dbDriver.directoryListing(this._normalizeFolderName(rootFolder))
    const filePath = filename => this._normalizeFileName(rootFolder, filename)

    await Promise.mapSeries(remoteFiles, async file =>
      this.diskDriver.upsertFile(filePath(file), await this.dbDriver.readFile(filePath(file)))
    )
  }

  async deleteFolder(folder: string): Promise<void> {
    await this._assertBotUnlocked(folder)
    if (this.isDirectoryGlob) {
      throw new Error("Ghost can't read or write under this scope")
    }

    const folderName = this._normalizeFolderName(folder)
    await this.primaryDriver.deleteDir(folderName)
  }

  async directoryListing(
    rootFolder: string,
    fileEndingPattern: string = '*.*',
    excludes?: string | string[],
    includeDotFiles?: boolean,
    options: DirectoryListingOptions = {}
  ): Promise<string[]> {
    try {
      const files = await this.primaryDriver.directoryListing(this._normalizeFolderName(rootFolder), {
        excludes,
        includeDotFiles,
        ...options
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

  async listDbRevisions(): Promise<FileRevision[]> {
    return this.dbDriver.listRevisions(this.baseDir)
  }

  async listDiskRevisions(): Promise<FileRevision[]> {
    return this.diskDriver.listRevisions(this.baseDir)
  }

  onFileChanged(callback: (filePath: string) => void): ListenHandle {
    const cb = file => callback && callback(file)
    this.events.on('changed', cb)
    return { remove: () => this.events.off('changed', cb) }
  }
}
