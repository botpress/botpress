import { Logger } from 'botpress/sdk'
import chokidar from 'chokidar'
import { ObjectCache } from 'common/object-cache'
import { inject, injectable, tagged } from 'inversify'
import path from 'path'

import { forceForwardSlashes } from '../../misc/utils'
import { TYPES } from '../../types'

export namespace CacheInvalidators {
  @injectable()
  export class FileChangedInvalidator {
    private watcher?: chokidar.FSWatcher
    private cache?: ObjectCache

    constructor(
      @inject(TYPES.Logger)
      @tagged('name', 'CacheInvalidator')
      private logger: Logger
    ) {}

    public install(objectCache: ObjectCache) {
      if (!objectCache) {
        return
      }

      this.cache = objectCache

      // TODO: move this into a constant/utils file
      const foldersToWatch = [
        path.join(process.PROJECT_LOCATION, 'data', 'bots'),
        path.join(process.PROJECT_LOCATION, 'data', 'global')
      ]

      this.watcher = chokidar.watch(foldersToWatch, {
        ignoreInitial: true,
        ignorePermissionErrors: true
      })

      this.watcher.on('add', this._handle)
      this.watcher.on('change', this._handle)
      this.watcher.on('unlink', this._handle)
      this.watcher.on('error', err => this.logger.attachError(err).error('Watcher error'))
    }

    private _relativePath = (file: string): string => {
      return forceForwardSlashes(path.relative(process.PROJECT_LOCATION, path.dirname(file)))
    }

    private _handle = async (file: string) => {
      if (!this.cache) {
        return
      }

      const relativePath = this._relativePath(file)

      await this.cache.invalidate(file)
      await this.cache.invalidateStartingWith(relativePath)
    }
  }
}
