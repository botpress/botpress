import Promise from 'bluebird'
import fs from 'fs'
import glob from 'glob'
import mkdirp from 'mkdirp'
import path from 'path'

import { inject, tagged } from '../../../node_modules/inversify'
import { TYPES } from '../../misc/types'
import Logger from '../../Logger'

import { GhostContentService, GhostPendingRevisions, GhostPendingRevisionsWithContent } from '.'
import { normalizeFolder } from './util'

const fsAsync: any = Promise.promisifyAll(fs)
const mkdirpAsync: any = Promise.promisify(mkdirp)

export default class FSGhostContentService implements GhostContentService {
  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'Ghost')
    private logger: Logger
  ) {}

  addRootFolder(rootFolder: string, options: { filesGlob: string; isBinary: boolean }): Promise<void> {
    const { normalizedFolderName } = normalizeFolder('bot123')(rootFolder)
    this.logger.debug(`Added root folder ${normalizedFolderName}, doing nothing.`)
    throw new Error('Method not implemented.')
  }

  upsertFile(rootFolder: string, file: string, content: string | Buffer): Promise<any> {
    const { folderPath } = normalizeFolder('bot123')(rootFolder)
    const filePath = path.join(folderPath, file)
    const fullFileFolder = path.dirname(filePath)
    return mkdirpAsync(fullFileFolder)
      .then(() => fsAsync.writeFileAsync(filePath, content))
      .catch(e => {
        this.logger.error(e, 'upsertFile error')
        throw e
      })
  }

  readFile(rootFolder: string, file: string): Promise<string | Buffer> {
    throw new Error('Method not implemented.')
  }
  deleteFile(rootFolder: string, file: string): Promise<void> {
    throw new Error('Method not implemented.')
  }
  directoryListing(rootFolder: string, fileEndingPattern: string): Promise<string[]> {
    throw new Error('Method not implemented.')
  }
  getPending(): Promise<GhostPendingRevisions> {
    throw new Error('Method not implemented.')
  }
  getPendingWithContent(options: { stringifyBinary: boolean }): Promise<GhostPendingRevisionsWithContent> {
    throw new Error('Method not implemented.')
  }
}
