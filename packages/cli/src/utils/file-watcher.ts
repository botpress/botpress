import watcher from '@parcel/watcher'
import { debounceAsync } from './concurrency-utils'
import { EventEmitter } from './event-emitter'

export type FileChangeHandler = (events: watcher.Event[]) => Promise<void>

type EmptyObject = Record<never, never>
type FileWatcherEvent = {
  error: unknown
  close: EmptyObject
}

type FileWatcherOptions = watcher.Options & {
  debounceMs?: number
}

/**
 * Wraps the Parcel file watcher to ensure errors can be catched in an async/await fashion
 */
export class FileWatcher {
  public static async watch(dir: string, fn: FileChangeHandler, opt?: FileWatcherOptions) {
    const eventEmitter = new EventEmitter<FileWatcherEvent>()

    let subscriptionHandler = async (err: Error | null, events: watcher.Event[]) => {
      if (err) {
        eventEmitter.emit('error', err)
        return
      }

      try {
        await fn(events)
      } catch (thrown) {
        eventEmitter.emit('error', thrown)
      }
    }

    if (opt?.debounceMs) {
      subscriptionHandler = debounceAsync(subscriptionHandler, opt.debounceMs)
    }

    const subscription = await watcher.subscribe(dir, subscriptionHandler, opt)
    return new FileWatcher(subscription, eventEmitter)
  }

  private constructor(
    private _subscription: watcher.AsyncSubscription,
    private _errorEmitter: EventEmitter<FileWatcherEvent>
  ) {}

  public async close() {
    await this._subscription.unsubscribe()
    this._errorEmitter.emit('close', {})
  }

  public wait = () =>
    new Promise((resolve, reject) => {
      this._errorEmitter.once('error', reject)
      this._errorEmitter.once('close', resolve)
    })
}
