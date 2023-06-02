import watcher from '@parcel/watcher'
import { EventEmitter } from './event-emitter'

export type FileChangeHandler = (events: watcher.Event[]) => Promise<void>

type EmptyObject = Record<never, never>
type FileWatcherEvent = {
  error: unknown
  close: EmptyObject
}

/**
 * Wraps the Parcel file watcher to ensure errors can be catched in an async/await fashion
 */
export class FileWatcher {
  public static async watch(dir: string, fn: FileChangeHandler, opt?: watcher.Options) {
    const eventEmitter = new EventEmitter<FileWatcherEvent>()
    const subscription = await watcher.subscribe(
      dir,
      async (err: Error | null, events: watcher.Event[]) => {
        if (err) {
          eventEmitter.emit('error', err)
          return
        }

        try {
          await fn(events)
        } catch (thrown) {
          eventEmitter.emit('error', thrown)
        }
      },
      opt
    )
    return new FileWatcher(subscription, eventEmitter)
  }

  private constructor(
    private subscription: watcher.AsyncSubscription,
    private errorEmitter: EventEmitter<FileWatcherEvent>
  ) {}

  public async close() {
    await this.subscription.unsubscribe()
    this.errorEmitter.emit('close', {})
  }

  public wait = () =>
    new Promise((resolve, reject) => {
      this.errorEmitter.once('error', reject)
      this.errorEmitter.once('close', resolve)
    })
}
