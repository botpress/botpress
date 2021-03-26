export class ArrayCache<K, V> {
  private array: V[] = []

  constructor(private getKey: (value: V) => K, private renameVal: (value: V, prevKey: K, newKey: K) => V) {}

  values() {
    return this.array
  }

  initialize(values: V[]) {
    this.array = values
  }

  reset() {
    this.array = []
  }

  get(key: K) {
    return this.array.find(x => this.getKey(x) === key)
  }

  update(key: K, value: V) {
    const index = this.indexOf(key)
    if (index >= 0) {
      this.array[index] = value
    } else {
      this.array.push(value)
    }
  }

  rename(prevKey: K, newKey: K) {
    const index = this.indexOf(prevKey)
    if (index >= 0) {
      this.array[index] = this.renameVal(this.array[index], prevKey, newKey)
    } else {
      throw new Error('Cannot rename a key that does not exist')
    }
  }

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
