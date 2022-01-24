import { DirectoryListingOptions } from 'botpress/sdk'
import { TYPES } from 'core/app/types'
import Database from 'core/database'
import { BPError } from 'core/dialog/errors'
import { filterByGlobs, forceForwardSlashes } from 'core/misc/utils'
import { WrapErrorsWith } from 'errors'
import { inject, injectable } from 'inversify'
import _ from 'lodash'
import { nanoid } from 'nanoid'
import path from 'path'
import { VError } from 'verror'

import { FileRevision, StorageDriver } from '../'

// TODO: Create a janitor that clears deleted files
@injectable()
export class DBStorageDriver implements StorageDriver {
  constructor(@inject(TYPES.Database) private database: Database) {}

  async upsertFile(filePath: string, content: string | Buffer, recordRevision: boolean): Promise<void>
  async upsertFile(filePath: string, content: string | Buffer): Promise<void>
  async upsertFile(filePath: string, content: string | Buffer, recordRevision: boolean = true): Promise<void> {
    try {
      let sql

      if (this.database.knex.isLite) {
        sql = `
        INSERT OR REPLACE INTO :tableName: (:keyCol:, :valueCol:, deleted, :modifiedOnCol:)
        VALUES (:key, :value, false, :now)
        `
      } else {
        sql = `
        INSERT INTO :tableName: (:keyCol:, :valueCol:, deleted, :modifiedOnCol:)
        VALUES (:key, :value, false, :now)
        ON CONFLICT (:keyCol:) DO UPDATE
          SET :valueCol: = :value, :modifiedOnCol: = :now, deleted = false
        `
      }

      await this.database.knex.raw(sql, {
        modifiedOnCol: 'modified_on',
        tableName: 'srv_ghost_files',
        keyCol: 'file_path',
        key: filePath,
        valueCol: 'content',
        value: this.database.knex.binary.set(content),
        now: this.database.knex.date.now()
      })

      if (recordRevision) {
        await this.database.knex('srv_ghost_index').insert({
          file_path: filePath,
          revision: nanoid(8),
          created_by: 'admin',
          created_on: this.database.knex.date.now()
        })
      }
    } catch (e) {
      throw new VError(e, `[DB Driver] Error upserting file "${filePath}"`)
    }
  }

  async fileExists(filePath: string): Promise<boolean> {
    try {
      const exists = await this.database
        .knex('srv_ghost_files')
        .where({ file_path: filePath, deleted: false })
        .select('file_path')
        .limit(1)
        .first()

      return !!exists
    } catch (e) {
      throw new VError(e, `[DB Driver] Error checking if file  exists "${filePath}"`)
    }
  }

  async fileSize(filePath: string): Promise<number> {
    try {
      const size = await this.database
        .knex('srv_ghost_files')
        .where({ file_path: filePath, deleted: false })
        .select(this.database.knex.raw('length(content) as len'))
        .limit(1)
        .first()
        .then(entry => entry.len)

      return size
    } catch (e) {
      throw new VError(e, `[DB Driver] Error checking file size for "${filePath}"`)
    }
  }

  async readFile(filePath: string): Promise<Buffer> {
    try {
      const file = await this.database
        .knex('srv_ghost_files')
        .where({
          file_path: filePath,
          deleted: false
        })
        .select('content')
        .limit(1)
        .first()
        .then()

      if (!file) {
        throw new BPError(`[DB Storage] File "${filePath}" not found`, 'ENOENT')
      }

      return Buffer.from((<any>file).content as Buffer)
    } catch (e) {
      throw new VError(e, `[DB Storage] Error reading file "${filePath}"`)
    }
  }

  @WrapErrorsWith(args => `[DB Storage] Error while moving file from "${args[0]}" to  "${args[1]}".`)
  async moveFile(fromPath: string, toPath: string) {
    await this.database
      .knex('srv_ghost_files')
      .update({ file_path: toPath })
      .where({ file_path: fromPath })
  }

  async deleteFile(filePath: string, recordRevision: boolean): Promise<void>
  async deleteFile(filePath: string): Promise<void>
  async deleteFile(filePath: string, recordRevision: boolean = true): Promise<void> {
    try {
      if (recordRevision) {
        await this.database
          .knex('srv_ghost_files')
          .where({ file_path: filePath })
          .update({ deleted: true })

        await this.database.knex('srv_ghost_index').insert({
          file_path: filePath,
          revision: nanoid(8),
          created_by: 'admin',
          created_on: this.database.knex.date.now()
        })
      } else {
        await this.database
          .knex('srv_ghost_files')
          .where({ file_path: filePath })
          .del()
      }
    } catch (e) {
      throw new VError(e, `[DB Storage] Error deleting file "${filePath}"`)
    }
  }

  async deleteDir(dirPath: string): Promise<void> {
    try {
      await this.database
        .knex('srv_ghost_files')
        .where('file_path', 'like', `${dirPath}%`)
        .update({ deleted: true })
    } catch (e) {
      throw new VError(e, `[DB Storage] Error deleting folder "${dirPath}"`)
    }
  }

  async directoryListing(
    folder: string,
    options: DirectoryListingOptions = {
      excludes: []
    }
  ): Promise<string[]> {
    try {
      let query = this.database
        .knex('srv_ghost_files')
        .select('file_path')
        .where({
          deleted: false
        })

      if (folder.length) {
        query = query.andWhere('file_path', 'like', `${folder}%`)
      }

      if (options.sortOrder) {
        const { column, desc } = options.sortOrder
        query = query.orderBy(column === 'modifiedOn' ? 'modified_on' : 'file_path', desc ? 'desc' : 'asc')
      }

      const paths = await query
        .then<Iterable<any>>()
        .map((x: any) => forceForwardSlashes(path.relative(folder, x.file_path)))

      if (!options.excludes || !options.excludes.length) {
        return paths
      }

      const ignoredGlobs = Array.isArray(options.excludes) ? options.excludes : [options.excludes]
      return filterByGlobs(paths, path => path, ignoredGlobs)
    } catch (e) {
      throw new VError(e, `[DB Storage] Error listing directory content for folder "${folder}"`)
    }
  }

  async listRevisions(pathPrefix: string): Promise<FileRevision[]> {
    try {
      let query = this.database.knex('srv_ghost_index')

      if (pathPrefix.length) {
        pathPrefix = pathPrefix.replace(/^.\//g, '') // Remove heading './' if present
        query = query.where('file_path', 'like', `${pathPrefix}%`)
      }

      return await query.then(entries =>
        entries.map(
          x =>
            <FileRevision>{
              path: x.file_path,
              revision: x.revision,
              created_on: new Date(x.created_on),
              created_by: x.created_by
            }
        )
      )
    } catch (e) {
      throw new VError(e, `[DB Storage] Error getting revisions in "${pathPrefix}"`)
    }
  }

  async deleteRevision(filePath: string, revision: string): Promise<void> {
    try {
      await this.database
        .knex('srv_ghost_index')
        .where({
          file_path: filePath,
          revision
        })
        .del()
    } catch (e) {
      throw new VError(e, `[DB Storage] Error deleting revision "${revision}" for file "${filePath}"`)
    }
  }
}
