import 'bluebird-global'
import fs from 'fs'
import glob from 'glob'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'
import mkdirp from 'mkdirp'
import path from 'path'

import { TYPES } from '../../misc/types'
import { FatalError } from '../../Errors'
import Logger from '../../Logger'

import {
  BotId,
  GhostContentService,
  GhostPendingRevisions,
  GhostPendingRevisionsWithContent,
  GhostWatchFolderOptions
} from '.'

const fsAsync: any = Promise.promisifyAll(fs)
const mkdirpAsync: any = Promise.promisify(mkdirp)

@injectable()
export default class FSGhostContentService implements GhostContentService {
  private folderOptions: { [x: string]: GhostWatchFolderOptions } = {}

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'Ghost')
    private logger: Logger,
    @inject(TYPES.ProjectLocation) private projectLocation: string
  ) {
    this.logger.debug('Using File System storage')
  }

  private normalizeFolder(botId: BotId, folder) {
    let pathPrefix, folderPath

    if (!folder.length) {
      throw new FatalError('Folder must be an non-empty string')
    }

    if (botId === 'global') {
      pathPrefix = 'GLOBAL'
      folderPath = path.join(path.resolve(this.projectLocation), 'data', folder)
    } else {
      pathPrefix = 'BOTS'
      folderPath = path.join(path.resolve(this.projectLocation), 'data', 'bots', folder)
    }

    return {
      folderPath,
      normalizedFolderName: path.join(pathPrefix, folder.toLowerCase())
    }
  }

  async addRootFolder(botId: BotId, rootFolder: string, options: GhostWatchFolderOptions): Promise<void> {
    const { normalizedFolderName } = this.normalizeFolder(botId, rootFolder)
    this.logger.debug(`Tracking ${normalizedFolderName} (${options.filesGlob})`)
    this.folderOptions[normalizedFolderName] = options
  }

  async upsertFile(botId: BotId, rootFolder: string, file: string, content: string | Buffer) {
    const { folderPath } = this.normalizeFolder(botId, rootFolder)
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

  readFile(botId: BotId, rootFolder: string, file: string): Promise<string | Buffer> {
    const { folderPath, normalizedFolderName } = this.normalizeFolder(botId, rootFolder)
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

  deleteFile(botId: BotId, rootFolder: string, file: string): Promise<void> {
    const { folderPath } = this.normalizeFolder(botId, rootFolder)
    const filePath = path.join(folderPath, file)
    return fsAsync.unlinkAsync(filePath).catch(e => {
      this.logger.error('deleteFile error', e)
      throw e
    })
  }

  async directoryListing(
    botId: BotId,
    rootFolder: string,
    fileEndingPattern: string,
    pathsToOmit: Array<string> = []
  ): Promise<string[]> {
    const { folderPath } = this.normalizeFolder(botId, rootFolder)

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

  async getPending(botId: BotId): Promise<GhostPendingRevisions> {
    return {}
  }

  async getPendingWithContent(
    botId: BotId,
    options: { stringifyBinary: boolean }
  ): Promise<GhostPendingRevisionsWithContent> {
    return {}
  }
}
