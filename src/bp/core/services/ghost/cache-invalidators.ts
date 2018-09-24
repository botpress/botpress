import { inject, injectable, postConstruct } from 'inversify'
import nsfw from 'nsfw'
import path from 'path'

import { TYPES } from '../../types'

import { ObjectCache } from '.'

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
    watcher!: {
      start: Function
      stop: Function
    }
    cache?: ObjectCache

    constructor(@inject(TYPES.ProjectLocation) private projectLocation: string) {}

    async install(objectCache: ObjectCache) {
      this.cache = objectCache
      this.watcher = await nsfw(path.join(this.projectLocation, './data'), this.handle)
      await this.watcher.start()
    }

    async stop() {
      await this.watcher.stop()
    }

    handle = (events: ChangeEventType[]) => {
      if (!this.cache) {
        return
      }

      if (events && events.length) {
        for (const event of events) {
          this.cache.invalidateStartingWith(event.directory)
        }
      }
    }
  }
}
