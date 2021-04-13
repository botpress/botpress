export class ArrayCache<K, V> {
  private array: V[] = []

  /**
   * Array cache
   * @param getKey Function allowing to specify which key to use when fetching a value from the inner cache
   * @param renameVal Function called when a key is renamed
   */
  constructor(private getKey: (value: V) => K, private renameVal: (value: V, prevKey: K, newKey: K) => V) {}

  /**
   * Returns all the content of the cache
   * @returns The content of the cache
   */
  values() {
    return this.array
  }

  /**
   * Initializes the cache with some values
   * @param values Some values of type V to initialize the cache with
   */
  initialize(values: V[]) {
    this.array = values
  }

  /**
   * Clears the cache of all its content
   */
  reset() {
    this.array = []
  }

  /**
   * Returns the value in the cache associated with the given key
   * @param key The key used to retrieve the object
   * @returns Returns an object of type V or undefined when the is no hit.
   */
  get(key: K) {
    return this.array.find(x => this.getKey(x) === key)
  }

  /**
   * Updates the value of a cached object.
   * **Will insert the object if it is not found in the cache.**
   * @param key The key associated with the object to update
   * @param value The new value to put in cache
   */
  update(key: K, value: V) {
    const index = this.indexOf(key)
    if (index >= 0) {
      this.array[index] = value
    } else {
      this.array.push(value)
    }
  }

  /**
   * Renames the key of a cache object
   * @param prevKey The old key
   * @param newKey The new key
   * @throws an Error if the key is not found
   */
  rename(prevKey: K, newKey: K) {
    const index = this.indexOf(prevKey)
    if (index >= 0) {
      this.array[index] = this.renameVal(this.array[index], prevKey, newKey)
    } else {
      throw new Error('Cannot rename a key that does not exist')
    }
  }

  /**
   * Removes an object from the cache
   * @param key The key used to retrieve the object
   */
  remove(key: K) {
    const index = this.indexOf(key)
    if (index >= 0) {
      this.array.splice(index, 1)
    } else {
      throw new Error('Cannot remove a key that does not exist')
    }
  }

  private indexOf(key: K) {
    return this.array.findIndex(x => this.getKey(x) === key)
  }
}
