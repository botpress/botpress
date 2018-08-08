import { ObjectCache } from '.'

export default class MemoryObjectCache implements ObjectCache {
  get<T>(key: string): Promise<T> {
    throw new Error('Method not implemented.')
  }
  set<T>(key: string, obj: T): Promise<void> {
    throw new Error('Method not implemented.')
  }
  has(key: string): Promise<boolean> {
    throw new Error('Method not implemented.')
  }
  invalidate(key: string): Promise<void> {
    throw new Error('Method not implemented.')
  }
}
