import { Logger } from 'botpress/sdk'
import fse from 'fs-extra'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'
import minimatch from 'minimatch'
import mkdirp from 'mkdirp'
import path from 'path'
import stream from 'stream'
import tmp from 'tmp'
import { VError } from 'verror'

import { BotpressConfig } from '../../config/botpress.config'
import { isValidBotId } from '../../misc/validation'
import { TYPES } from '../../types'

import { GhostPendingRevisions, GhostPendingRevisionsWithContent, ObjectCache, StorageDriver } from '.'
import DBStorageDriver from './db-driver'
import DiskStorageDriver from './disk-driver'

const tar = require('tar')

@injectable()
export class GhostService {
  private config: Partial<BotpressConfig> | undefined

  public get isGhostEnabled() {
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
      this.isGhostEnabled,
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
      this.isGhostEnabled,
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

    const diskRevs = await this.diskDriver.listRevisions(this.baseDir)
    const dbRevs = await this.dbDriver.listRevisions(this.baseDir)
    const syncedRevs = _.intersectionBy(diskRevs, dbRevs, x => `${x.path} | ${x.revision}`)
    await Promise.each(syncedRevs, rev => this.dbDriver.deleteRevision(rev.path, rev.revision))

    if (!(await this.isFullySynced())) {
      this.logger.warn(`Found unsynced file changes in "${this.baseDir}"`)
      return
    }

    for (const path of [...paths, './']) {
      const normalizedPath = this.normalizeFolderName(path)
      let currentFiles = await this.dbDriver.directoryListing(normalizedPath)
      let newFiles = await this.diskDriver.directoryListing(normalizedPath)

      if (path === './') {
        currentFiles = currentFiles.filter(x => !x.includes('/'))
        newFiles = newFiles.filter(x => !x.includes('/'))
      }

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

  public async revertFileRevision(fullFilePath: string, revision: string): Promise<void> {
    const backup = await this.dbDriver.readFile(fullFilePath)
    try {
      const content = await this.diskDriver.readFile(fullFilePath)
      await this.dbDriver.upsertFile(fullFilePath, content, false)
      await this.dbDriver.deleteRevision(fullFilePath, revision)
      await this.cache.invalidateStartingWith(fullFilePath)
    } catch (err) {
      await this.dbDriver.upsertFile(fullFilePath, backup)
      throw err
    }
  }

  public async exportArchive(): Promise<Buffer> {
    const allFiles = await this.directoryListing('./')
    const tmpDir = tmp.dirSync()

    for (const file of allFiles.filter(x => x !== 'revisions.json')) {
      const content = await this.primaryDriver.readFile(this.normalizeFileName('./', file))
      const outPath = path.join(tmpDir.name, file)
      mkdirp.sync(path.dirname(outPath))
      await fse.writeFile(outPath, content)
    }

    const oldRevisions = await this.diskDriver.listRevisions(this.baseDir)
    const newRevisions = await this.dbDriver.listRevisions(this.baseDir)
    const mergedRevisions = _.unionBy(oldRevisions, newRevisions, x => x.path + ' ' + x.revision)
    await fse.writeFile(path.join(tmpDir.name, 'revisions.json'), JSON.stringify(mergedRevisions, undefined, 2))
    if (!allFiles.includes('revisions.json')) {
      allFiles.push('revisions.json')
    }

    const outFile = path.join(tmpDir.name, 'archive.tgz')

    await tar.create(
      {
        cwd: tmpDir.name,
        file: outFile,
        portable: true,
        gzip: true
      },
      allFiles
    )

    return fse.readFile(outFile)
  }

  // TODO WIP Partial progress towards importing tarballs from the UI

  // public async importArchive(tarball: Buffer): Promise<void> {
  //   const tgzStream = new stream.PassThrough()
  //   const tmpDir = tmp.dirSync()
  //   tgzStream.end(tarball)
  //   tgzStream.pipe(
  //     tar.x({
  //       cwd: tmpDir.name
  //     })
  //   )
  //   await Promise.fromCallback(cb => {
  //     tgzStream.on('end', () => cb(undefined))
  //     tgzStream.on('error', err => cb(err))
  //   })

  //   const files = await fse.readdir(tmpDir.name)
  // }

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

  async directoryListing(
    rootFolder: string,
    fileEndingPattern: string = '*.*',
    exludes?: string | string[]
  ): Promise<string[]> {
    try {
      const files = await this.primaryDriver.directoryListing(this.normalizeFolderName(rootFolder), exludes)
      return files.filter(minimatch.filter(fileEndingPattern, { matchBase: true, nocase: true, noglobstar: false }))
    } catch (err) {
      if (err && err.message && err.message.includes('ENOENT')) {
        return []
      }
      throw new VError(err, `Could not list directory under ${rootFolder}`)
    }
  }

  async getPending(): Promise<GhostPendingRevisions> {
    if (!this.useDbDriver) {
      return {}
    }

    const revisions = await this.dbDriver.listRevisions(this.baseDir)
    const result: GhostPendingRevisions = {}

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

  async getPendingWithContent(): Promise<GhostPendingRevisionsWithContent> {
    const revisions = await this.getPending()
    const result = {}
    for (const folder in revisions) {
      result[folder] = await Promise.mapSeries(revisions[folder], async x => {
        const content = await this.dbDriver.readFile(x.path)
        return { ...x, content: content.toString() }
      })
    }
    return result
  }
}
