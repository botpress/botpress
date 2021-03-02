type IndexableValues = string | number
// Only keep keys of T were its correspond value is mandatory and either of type string or number
type NonOptionalKeys<T> = {
  [k in keyof T]-?: undefined extends T[k] ? never : T[k] extends IndexableValues ? k : never
}[keyof T]

/**
 * A generic cache used to store any king of bot data.
 *
 * _Note: `V` must be a key/value object with a minimum of one key being **non optional** and of type **string or number**_
 */
export class BotDataCache<V extends {}> {
  private _key: NonOptionalKeys<V>
  private _cache: Map<string, Map<any, V>>

  /**
   *
   * @param key The key used to store and retrieve the data of type `T`
   */
  constructor(key: NonOptionalKeys<V>) {
    this._key = key
    this._cache = new Map<string, Map<V[NonOptionalKeys<V>], V>>()
  }

  /**
   * Caches data or update a currently cached data
   * @param botId The id of the bot used to store the data
   * @param data Either an object or an array of objects to cache
   */
  public set(botId: string, data: V | V[]): void {
    if (Array.isArray(data)) {
      const map = new Map(data.map(f => [f[this._key], f]))
      this._cache.set(botId, map)
    } else {
      if (this._cache.has(botId)) {
        this._cache.get(botId)!.set(data[this._key], data)
      } else {
        this.set(botId, [data])
      }
    }
  }

  /**
   * Removes a bot from the cache
   * @param botId The id of the bot to be removed from the cache
   */
  public remove(botId: string): void
  /**
   * Removes cached data for a given bot
   * @param botId The id of the bot used to remove the data
   * @param key The key corresponding to the data to remove
   */
  public remove(botId: string, key: V[NonOptionalKeys<V>]): void
  public remove(botId: string, key?: V[NonOptionalKeys<V>]): void {
    if (key) {
      if (this._cache.has(botId)) {
        this._cache.get(botId)!.delete(key)
      }
    } else {
      this._cache.delete(botId)
    }
  }

  /**
   * Retrieves all cached data for a given bot
   * @param botId The id of the bot used to retrieve the data
   */
  public get(botId: string): V[]
  /**
   * Retrieves a single data from the cache
   * @param botId The id of the bot used to retrieve the data
   * @param key The key corresponding to the data to retrieve
   */
  public get(botId: string, key: V[NonOptionalKeys<V>]): V | undefined
  public get(botId: string, key: V[NonOptionalKeys<V>] = null as any): V | undefined | V[] {
    if (!this._cache.has(botId)) {
      return undefined
    }

    if (key) {
      return this._cache.get(botId)!.get(key)
    }

    return Array.from(this._cache.get(botId)!.values())
  }

  /**
   * Checks whether or not the bot exists in the cache
   * @param botId The id used to see if the bot exists in the cache
   */
  public has(botId: string): boolean
  /**
   * Checks whether or not a data exists the in the bot's cache
   * @param botId The id of the bot used to retrieve the data
   * @param key The key used to see if the data exists in the cache
   */
  public has(botId: string, key: V[NonOptionalKeys<V>]): boolean
  public has(botId: string, key: V[NonOptionalKeys<V>] = null as any): boolean {
    if (key) {
      if (!this._cache.has(botId)) {
        return false
      } else {
        return this._cache.get(botId)!.has(key)
      }
    }

    return this._cache.has(botId)
  }

  /**
   * Checks whether or not the cache is empty
   */
  public isEmpty(): boolean
  /**
   * Checks whether or not a bot's cache is empty
   * @param botId The id of the bot used to retrieve the data
   */
  public isEmpty(botId: string): boolean
  public isEmpty(botId?: string): boolean {
    if (botId) {
      if (!this._cache.has(botId)) {
        return true
      } else {
        return this._cache.get(botId)!.size === 0
      }
    }

    return this._cache.size === 0
  }
}
