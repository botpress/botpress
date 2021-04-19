import bytes from 'bytes'
import chokidar from 'chokidar'
import { EventEmitter } from 'events'
import LRU from 'lru-cache'
import path from 'path'
import { forceForwardSlashes } from './misc'

export interface ObjectCache {
  readonly events: EventEmitter
  get<T>(key: string): Promise<T>
  set<T>(key: string, obj: T): Promise<void>
  has(key: string): Promise<boolean>
  invalidate(key: string): Promise<void>
  invalidateStartingWith(prefix: string): Promise<void>
  sync(message: string): Promise<void>
}

// namespace CacheInvalidators {
//   enum ChangeEventAction {
//     CREATED = 0,
//     DELETED = 1,
//     MODIFIED = 2,
//     RENAMED = 3
//   }

//   /**
//    * See https://github.com/Axosoft/nsfw/tree/master/docs
//    */
//   interface ChangeEventType {
//     /** the type of event that occurred */
//     action: ChangeEventAction
//     /** the location the event took place */
//     directory: string
//     /** the name of the file that was changed (Not available for rename events) */
//     file: string
//     /** the name of the file before a rename (Only available for rename events) */
//     oldFile: string
//     /** the name of the file after a rename (Only available for rename events) */
//     newFile: string
//   }
// }

class FileChangedInvalidator {
  constructor() {}
  watcher!: {
    start: Function
    stop: Function
  }
  cache?: ObjectCache

  install(objectCache: ObjectCache) {
    this.cache = objectCache

    const foldersToWatch = [
      path.join(process.PROJECT_LOCATION, 'data', 'bots'),
      path.join(process.PROJECT_LOCATION, 'data', 'global')
    ]

    const watcher = chokidar.watch(foldersToWatch, {
      ignoreInitial: true,
      ignorePermissionErrors: true
    })

    watcher.on('add', this.handle)
    watcher.on('change', this.handle)
    watcher.on('unlink', this.handle)
    // watcher.on('error', err => this.logger.attachError(err).error('Watcher error'))
  }

  async stop() {
    await this.watcher.stop()
  }

  handle = async file => {
    if (!this.cache) {
      return
    }

    const relativePath = forceForwardSlashes(path.relative(process.PROJECT_LOCATION, path.dirname(file)))
    this.cache.events.emit('invalidation', relativePath)
    await this.cache.invalidateStartingWith(relativePath)
  }
}

export class MemoryObjectCache implements ObjectCache {
  private cache: LRU<string, any>
  private cacheInvalidator: FileChangedInvalidator

  public readonly events: EventEmitter = new EventEmitter()

  constructor() {
    this.cacheInvalidator = new FileChangedInvalidator()
    this.cache = new LRU({
      max: bytes(process.core_env.BP_MAX_MEMORY_CACHE_SIZE || '1gb'),
      length: obj => {
        if (Buffer.isBuffer(obj)) {
          return obj.length
        } else if (typeof obj === 'string') {
          return obj.length * 2 // chars are 2 bytes in ECMAScript
        }

        return 1024 // Assuming 1kb per object, this is kind of random
      }
    })

    this.cacheInvalidator.install(this)
  }

  async get<T>(key: string): Promise<T> {
    return <T>this.cache.get(key)
  }

  async set<T>(key: string, obj: T): Promise<void> {
    this.cache.set(key, obj)
    this.events.emit('invalidation', key)
  }

  async has(key: string): Promise<boolean> {
    return this.cache.has(key)
  }

  async invalidate(key: string): Promise<void> {
    this.cache.del(key)
    this.events.emit('invalidation', key)
  }

  async invalidateStartingWith(prefix: string): Promise<void> {
    const keys = this.cache.keys().filter(x => {
      return x.startsWith('buffer::' + prefix) || x.startsWith('string::' + prefix) || x.startsWith('object::' + prefix)
    })

    keys.forEach(x => this.cache.del(x))
    this.events.emit('invalidation', prefix)
  }

  async sync(message: string): Promise<void> {
    this.events.emit('syncDbFilesToDisk', message)
  }
}
