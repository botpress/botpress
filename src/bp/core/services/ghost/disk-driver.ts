import { forceForwardSlashes } from 'core/misc/utils'
import { WrapErrorsWith } from 'errors'
import fse from 'fs-extra'
import glob from 'glob'
import { injectable } from 'inversify'
import _ from 'lodash'
import os from 'os'
import path from 'path'
import { VError } from 'verror'

import { FileRevision, StorageDriver } from '.'

@injectable()
export default class DiskStorageDriver implements StorageDriver {
  resolvePath = p => path.resolve(process.PROJECT_LOCATION, p)

  async upsertFile(filePath: string, content: string | Buffer): Promise<void>
  async upsertFile(filePath: string, content: string | Buffer, recordRevision: boolean = false): Promise<void> {
    try {
      const folder = path.dirname(this.resolvePath(filePath))
      await fse.mkdirp(folder)
      await fse.writeFile(this.resolvePath(filePath), content)
    } catch (e) {
      throw new VError(e, `[Disk Storage] Error upserting file "${filePath}"`)
    }
  }

  async createDir(dirname: string): Promise<any> {
    return fse.ensureDir(dirname)
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

  async deleteFile(filePath: string): Promise<void>
  async deleteFile(filePath: string, recordRevision: boolean = false): Promise<void> {
    try {
      return fse.unlink(this.resolvePath(filePath))
    } catch (e) {
      throw new VError(e, `[Disk Storage] Error deleting file "${filePath}"`)
    }
  }

  @WrapErrorsWith(args => `[Disk Storage Error while moving file from "${args[0]}" to  "${args[1]}".`)
  async moveFile(fromPath: string, toPath: string): Promise<void> {
    return fse.move(this.resolvePath(fromPath), this.resolvePath(toPath))
  }

  async deleteDir(dirPath: string): Promise<void> {
    try {
      return fse.removeSync(this.resolvePath(dirPath))
    } catch (e) {
      throw new VError(e, `[Disk Storage] Error deleting directory "${dirPath}"`)
    }
  }

  async directoryListing(
    folder: string,
    options: { excludes?: string | string[]; includeDotFiles?: boolean } = { excludes: [], includeDotFiles: false }
  ): Promise<string[]> {
    try {
      await fse.access(this.resolvePath(folder), fse.constants.R_OK)
    } catch (e) {
      // if directory doesn't exist we don't care
      if (e.code === 'ENOENT') {
        return []
      }

      throw new VError(e, `[Disk Storage] No read access to directory "${folder}"`)
    }

    const ghostIgnorePatterns = await this._getGhostIgnorePatterns(this.resolvePath('data/.ghostignore'))
    const globOptions = {
      cwd: this.resolvePath(folder),
      dot: options.includeDotFiles
    }

    // options.excludes can either be a string or an array of strings or undefined
    if (Array.isArray(options.excludes)) {
      globOptions['ignore'] = [...options.excludes, ...ghostIgnorePatterns]
    } else if (options.excludes) {
      globOptions['ignore'] = [options.excludes, ...ghostIgnorePatterns]
    } else {
      globOptions['ignore'] = ghostIgnorePatterns
    }

    try {
      const files = await Promise.fromCallback<string[]>(cb => glob('**/*.*', globOptions, cb))
      return files.map(filePath => forceForwardSlashes(filePath))
    } catch (e) {
      return []
    }
  }

  async deleteRevision(filePath: string, revision: string): Promise<void> {
    throw new Error('Method not implemented.')
  }

  async listRevisions(pathPrefix: string): Promise<FileRevision[]> {
    try {
      const content = await this.readFile(path.join(pathPrefix, 'revisions.json'))
      return JSON.parse(content.toString())
    } catch (err) {
      return []
    }
  }

  async absoluteDirectoryListing(destination: string) {
    try {
      const files = await Promise.fromCallback<string[]>(cb => glob('**/*.*', { cwd: destination }, cb))
      return files.map(filePath => forceForwardSlashes(filePath))
    } catch (e) {
      return []
    }
  }

  private _getBaseDirectories(files: string[]): string[] {
    return _.chain(files)
      .map(f => path.relative(process.PROJECT_LOCATION, f))
      .map(f => path.dirname(f))
      .map(f => f.split('/')[0])
      .uniq()
      .value()
  }

  private async _getGhostIgnorePatterns(ghostIgnorePath: string): Promise<string[]> {
    if (await fse.pathExists(ghostIgnorePath)) {
      const ghostIgnoreFile = await fse.readFile(ghostIgnorePath)
      return ghostIgnoreFile.toString().split(/\r?\n/gi)
    }
    return []
  }
}
