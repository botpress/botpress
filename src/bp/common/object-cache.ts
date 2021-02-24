import { EventEmitter } from 'events'

export interface ObjectCache {
  readonly events: EventEmitter
  get<T>(key: string): T
  set<T>(key: string, obj: T): void
  has(key: string): boolean
  invalidate(key: string): Promise<void>
  invalidateStartingWith(prefix: string): Promise<void>
  sync(message: string): Promise<void>
}
