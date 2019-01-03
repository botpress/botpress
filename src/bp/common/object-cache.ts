import { EventEmitter } from 'events'

export interface ObjectCache {
  readonly events: EventEmitter
  get<T>(key: string): Promise<T>
  set<T>(key: string, obj: T): Promise<void>
  has(key: string): Promise<boolean>
  invalidate(key: string): Promise<void>
  invalidateStartingWith(prefix: string): Promise<void>
}
