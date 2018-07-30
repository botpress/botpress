import 'bluebird-global'
import fs from 'fs'
import glob from 'glob'
import { inject, tagged } from 'inversify'
import _ from 'lodash'
import mkdirp from 'mkdirp'
import path from 'path'

import { TYPES } from '../../misc/types'
import Logger from '../../Logger'

import {
  GhostContentService,
  GhostPendingRevisions,
  GhostPendingRevisionsWithContent,
  GhostWatchFolderOptions
} from '.'
import { normalizeFolder } from './util'

const fsAsync: any = Promise.promisifyAll(fs)
const mkdirpAsync: any = Promise.promisify(mkdirp)

export default class FSGhostContentService implements GhostContentService {
  private folderOptions: { [x: string]: GhostWatchFolderOptions } = {}

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'Ghost')
    private logger: Logger
  ) {
    this.logger.debug('Using File Ghost')
  }

  async addRootFolder(rootFolder: string, options: GhostWatchFolderOptions): Promise<void> {
    const { normalizedFolderName } = normalizeFolder('bot123')(rootFolder)
    this.logger.debug(`Tracking ${normalizedFolderName}`)
    this.folderOptions[normalizedFolderName] = options
  }

  async upsertFile(rootFolder: string, file: string, content: string | Buffer) {
    const { folderPath } = normalizeFolder('bot123')(rootFolder)
    const filePath = path.join(folderPath, file)
    const fullFileFolder = path.dirname(filePath)

    try {
      await mkdirpAsync(fullFileFolder)
      await fsAsync.writeFileAsync(filePath, content)
    } catch (e) {
      this.logger.error('upsertFile error', e)
      throw e
    }
  }

  readFile(rootFolder: string, file: string): Promise<string | Buffer> {
    const { folderPath, normalizedFolderName } = normalizeFolder('bot123')(rootFolder)
    const filePath = path.join(folderPath, file)
    const isBinary = _.get(this.folderOptions[normalizedFolderName], 'isBinary', false)

    return fsAsync
      .readFileAsync(filePath, isBinary ? undefined : 'utf8')
      .catch({ code: 'ENOENT' }, () => undefined)
      .catch(e => {
        this.logger.error('readFile error', e)
        throw e
      })
  }

  deleteFile(rootFolder: string, file: string): Promise<void> {
    const { folderPath } = normalizeFolder('bot123')(rootFolder)
    const filePath = path.join(folderPath, file)
    return fsAsync.unlinkAsync(filePath).catch(e => {
      this.logger.error('deleteFile error', e)
      throw e
    })
  }

  async directoryListing(
    rootFolder: string,
    fileEndingPattern: string,
    pathsToOmit: Array<string> = []
  ): Promise<string[]> {
    const { folderPath } = normalizeFolder('bot123')(rootFolder)

    try {
      await fsAsync.accessAsync(folderPath)
      return Promise.fromCallback(cb => glob(`**/*${fileEndingPattern}`, { cwd: folderPath }, cb)).then(paths =>
        paths.filter(path => !pathsToOmit.includes(path))
      )
    } catch (e) {
      this.logger.error('directoryListing error', e)
      throw e
    }
  }

  async getPending(): Promise<GhostPendingRevisions> {
    return {}
  }

  async getPendingWithContent(options: { stringifyBinary: boolean }): Promise<GhostPendingRevisionsWithContent> {
    return {}
  }
}
