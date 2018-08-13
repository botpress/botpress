import 'bluebird-global'
import fse from 'fs-extra'
import glob from 'glob'
import { inject, injectable } from 'inversify'
import path from 'path'
import { VError } from 'verror'

import { TYPES } from '../../misc/types'

import { StorageDriver } from '.'

@injectable()
export default class DiskStorageDriver implements StorageDriver {
  constructor(@inject(TYPES.ProjectLocation) private projectLocation: string) {}

  resolvePath = p => path.resolve(this.projectLocation, p)

  async upsertFile(filePath: string, content: string | Buffer): Promise<void> {
    try {
      const folder = path.dirname(this.resolvePath(filePath))
      await fse.mkdirp(folder)
      await fse.writeFile(this.resolvePath(filePath), content)
    } catch (e) {
      throw new VError(e, `[Disk Storage] Error upserting file "${filePath}"`)
    }
  }

  async readFile(filePath: string): Promise<Buffer> {
    try {
      return fse.readFile(this.resolvePath(filePath))
    } catch (e) {
      if (e.code === 'ENOENT') {
        throw new Error(`[Disk Storage] File "${filePath}" not found`)
      }

      throw new VError(e, `[Disk Storage] Error reading file "${filePath}"`)
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      return fse.unlink(this.resolvePath(filePath))
    } catch (e) {
      throw new VError(e, `[Disk Storage] Error deleting file "${filePath}"`)
    }
  }

  async directoryListing(folder: string, fileEndingPattern: string): Promise<string[]> {
    const isDirectoryRange = folder.includes('*')
    let pattern = `**/*${fileEndingPattern}`
    let directory = folder

    if (isDirectoryRange) {
      directory = folder.substr(0, folder.indexOf('*'))
      const rootDir = folder.substr(folder.indexOf('*') + 1)
      pattern = path.join(rootDir, '/' + pattern)
    }

    try {
      await fse.access(this.resolvePath(directory), fse.constants.R_OK)
    } catch (e) {
      throw new VError(e, `[Disk Storage] No read access to directory "${directory}"`)
    }

    try {
      return Promise.fromCallback(cb => glob(pattern, { cwd: this.resolvePath(directory) }, cb))
    } catch (e) {
      throw new VError(e, `[Disk Storage] Error listing directory content for folder "${directory}"`)
    }
  }
}
