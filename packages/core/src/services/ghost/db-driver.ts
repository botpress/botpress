import glob from 'glob'
import { inject, injectable } from 'inversify'
import path from 'path'
import { VError } from 'verror'

import Database from '../../database'
import { TYPES } from '../../misc/types'

import { StorageDriver } from '.'

@injectable()
export default class DBStorageDriver implements StorageDriver {
  constructor(@inject(TYPES.Database) private database: Database) {}

  async upsertFile(filePath: string, content: string | Buffer, recordRevision: boolean): Promise<void>
  async upsertFile(filePath: string, content: string | Buffer): Promise<void>
  async upsertFile(filePath: string, content: string | Buffer, recordRevision: boolean = true): Promise<void> {
    try {
      const folder = path.dirname(filePath)
      const fileName = path.basename(filePath)
      this.database.knex('').where({ folder, file: fileName }) // TODO IMPL
    } catch (e) {
      throw new VError(e, `[Disk Storage] Error upserting file "${filePath}"`)
    }
  }

  async readFile(filePath: string): Promise<Buffer> {
    try {
      return new Buffer('') // TODO IMPL
    } catch (e) {
      if (e.code === 'ENOENT') {
        throw new Error(`[Disk Storage] File "${filePath}" not found`)
      }

      throw new VError(e, `[Disk Storage] Error reading file "${filePath}"`)
    }
  }

  async deleteFile(filePath: string, recordRevision: boolean): Promise<void>
  async deleteFile(filePath: string): Promise<void>
  async deleteFile(filePath: string, recordRevision: boolean = true): Promise<void> {
    try {
      // TODO IMPL
    } catch (e) {
      throw new VError(e, `[Disk Storage] Error deleting file "${filePath}"`)
    }
  }

  async directoryListing(folder: string, fileEndingPattern: string): Promise<string[]> {
    const isDirectoryRange = folder.includes('*')
    let pattern = fileEndingPattern.startsWith('.') ? `**/*${fileEndingPattern}` : `**/${fileEndingPattern}`
    let directory = folder

    if (isDirectoryRange) {
      directory = folder.substr(0, folder.indexOf('*'))
      const rootDir = folder.substr(folder.indexOf('*') + 1)
      pattern = path.join(rootDir, '/' + pattern)
    }

    pattern = pattern.replace(/\/+/, '') // Remove all leading "/"

    try {
      // await fse.access(this.resolvePath(directory), fse.constants.R_OK)
    } catch (e) {
      throw new VError(e, `[Disk Storage] No read access to directory "${directory}"`)
    }

    try {
      // return Promise.fromCallback<string[]>(cb => glob(pattern, { cwd: this.resolvePath(directory) }, cb))
      // TODO IMPL
      return []
    } catch (e) {
      throw new VError(e, `[Disk Storage] Error listing directory content for folder "${directory}"`)
    }
  }

  async listRevisionIds(pathPrefix: string): Promise<string[]> {
    throw new Error('Method not implemented.')
  }

  async deleteRevisions(revisionIds: string[]) {}
}
