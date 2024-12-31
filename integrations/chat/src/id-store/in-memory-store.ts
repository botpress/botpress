import { logger } from '../logger'
import * as errors from './errors'
import * as types from './types'

class InMemoryMap implements types.IncomingIdMap, types.OutoingIdMap {
  public constructor(
    private _direction: 'incoming' | 'outgoing',
    private _incoming: Record<string, string> = {},
    private _outgoing: Record<string, string> = {}
  ) {}

  public find = async (key: string) => {
    const value = this._incoming[key]
    this._debug('find', key, value ?? '∅')
    return value
  }

  public get = async (key: string) => {
    const value = this._incoming[key]
    this._debug('get', key, value ?? '∅')
    return value ?? key
  }

  public set = async (key: string, value: string) => {
    const existingValue = this._incoming[key]
    if (existingValue !== undefined && existingValue !== value) {
      throw new errors.IdAlreadyAssignedError(key)
    }

    const existingKey = this._outgoing[value]
    if (existingKey !== undefined && existingKey !== key) {
      throw new errors.IdAlreadyAssignedError(value)
    }

    this._debug('set', key, value)
    this._incoming[key] = value
    this._outgoing[value] = key
  }

  public delete = async (key: string) => {
    const value = this._incoming[key]
    if (value === undefined) {
      return
    }
    this._debug('delete', key, value)
    delete this._incoming[key]
    delete this._outgoing[value]
  }

  public fetch = async () => {
    // store is already in memory, no need to fetch anything
    return {
      find: (key: string) => this._incoming[key],
      get: (key: string) => {
        const value = this._incoming[key]
        return value ?? key
      },
    }
  }

  private _debug = (operation: string, src: string, dest: string) => {
    if (this._direction === 'incoming') {
      logger.debug(`${operation} ${src} -> ${dest}`)
    } else {
      logger.debug(`${operation} ${dest} <- ${src}`)
    }
  }
}

export class MemorySpace {
  private _memory: Record<string, any> = {}

  public subSpace(namespace: string) {
    const newSpace = new MemorySpace()
    newSpace._memory = this.instanciate(namespace, {})
    return newSpace
  }

  public instanciate<T extends {}>(namespace: string, init: T) {
    if (this._memory[namespace] === undefined) {
      this._memory[namespace] = init
    }
    return this._memory[namespace] as T
  }
}

export class InMemoryChatIdStore implements types.ChatIdStore {
  private _byFid: Record<string, string> = {}
  private _byId: Record<string, string> = {}

  public constructor(memSpace?: MemorySpace) {
    memSpace = memSpace ?? new MemorySpace()
    this._byFid = memSpace.instanciate('byFid', {})
    this._byId = memSpace.instanciate('byId', {})
  }

  public get byFid() {
    return new InMemoryMap('incoming', this._byFid, this._byId)
  }

  public get byId() {
    return new InMemoryMap('outgoing', this._byId, this._byFid)
  }
}
