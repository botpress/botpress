import * as sdk from 'botpress/sdk'

import { KeyValueStore } from './'

/**
 * Wraps the true KeyValueStore so botId is passed at construction.
 */
export class KvsService implements sdk.KvsService {
  constructor(private kvs: KeyValueStore, private botId?: string) {}

  async get(key: string, path?: string): Promise<any> {
    return this.kvs.get(this.botId, key, path)
  }

  async set(key: string, value: string, path?: string) {
    return this.kvs.set(this.botId, key, value, path)
  }

  async getStorageWithExpiry(key): Promise<any> {
    return this.kvs.getStorageWithExpiry(this.botId, key)
  }

  async setStorageWithExpiry(key: string, value, expiryInMs?: string): Promise<void> {
    return this.kvs.setStorageWithExpiry(this.botId, key, value, expiryInMs)
  }

  async removeStorageKeysStartingWith(key): Promise<void> {
    return this.kvs.removeStorageKeysStartingWith(key)
  }

  getConversationStorageKey(sessionId, variable): string {
    return this.kvs.getConversationStorageKey(sessionId, variable)
  }

  getUserStorageKey(userId, variable): string {
    return this.kvs.getUserStorageKey(userId, variable)
  }

  getGlobalStorageKey(variable): string {
    return this.kvs.getGlobalStorageKey(variable)
  }
}
