import { Logger } from 'botpress/sdk'
import chokidar from 'chokidar'
import { ObjectCache } from 'common/object-cache'
import { TYPES } from 'core/app/types'
import { forceForwardSlashes } from 'core/misc/utils'
import { inject, injectable, tagged } from 'inversify'
import path from 'path'
import yn from 'yn'

export namespace CacheInvalidators {
  enum ChangeEventAction {
    CREATED = 0,
    DELETED = 1,
    MODIFIED = 2,
    RENAMED = 3
  }

  /**
   * See https://github.com/Axosoft/nsfw/tree/master/docs
   */
  interface ChangeEventType {
    /** the type of event that occurred */
    action: ChangeEventAction
    /** the location the event took place */
    directory: string
    /** the name of the file that was changed (Not available for rename events) */
    file: string
    /** the name of the file before a rename (Only available for rename events) */
    oldFile: string
    /** the name of the file after a rename (Only available for rename events) */
    newFile: string
  }

  @injectable()
  export class FileChangedInvalidator {
    constructor(
      @inject(TYPES.Logger)
      @tagged('name', 'CacheInvalidator')
      private logger: Logger
    ) {}
    watcher!: {
      start: Function
      stop: Function
    }
    cache?: ObjectCache

    install(objectCache: ObjectCache) {
      this.cache = objectCache

      if (yn(process.core_env.CORE_DISABLE_FILE_LISTENERS)) {
        return
      }

      const foldersToWatch = [
        path.join(process.PROJECT_LOCATION, 'data', 'bots'),
        path.join(process.PROJECT_LOCATION, 'data', 'global')
      ]

      const watcher = chokidar.watch(foldersToWatch, {
        ignoreInitial: true,
        ignorePermissionErrors: true,
        ignored: path => path.includes('node_modules')
      })

      watcher.on('add', this.handle)
      watcher.on('change', this.handle)
      watcher.on('unlink', this.handle)
      watcher.on('error', err => this.logger.attachError(err).error('Watcher error'))
    }

    async stop() {
      await this.watcher.stop()
    }

    handle = async file => {
      if (!this.cache) {
        return
      }

      const relativePath = forceForwardSlashes(path.relative(process.PROJECT_LOCATION, file))
      await this.cache.invalidateStartingWith(path.dirname(relativePath))
      this.cache.events.emit('invalidation', `file::${relativePath}`)
    }
  }
}
