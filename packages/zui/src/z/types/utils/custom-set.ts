import { isEqual } from './is-equal'

export type CustomSetOptions<T> = {
  compare: (a: T, b: T) => boolean
}

const DEFAULT_OPTIONS: CustomSetOptions<any> = {
  compare: isEqual,
}

export class CustomSet<T> {
  private _items: T[]
  private _options: CustomSetOptions<T>

  public constructor(items: T[] = [], opt: Partial<CustomSetOptions<T>> = {}) {
    this._options = { ...DEFAULT_OPTIONS, ...opt }
    this._items = []
    for (const i of items) {
      this.add(i)
    }
  }

  public get items(): T[] {
    return [...this._items]
  }

  public get size(): number {
    return this._items.length
  }

  public has(item: T): boolean {
    return this._items.some((i) => this._options.compare(i, item))
  }

  public add(item: T): void {
    if (!this.has(item)) {
      this._items.push(item)
    }
  }

  public isEqual(other: CustomSet<T>): boolean {
    if (this.size !== other.size) {
      return false
    }
    return this.isSubsetOf(other) && other.isSubsetOf(this)
  }

  public isSubsetOf(other: CustomSet<T>): boolean {
    if (this.size > other.size) {
      return false
    }
    return this._items.every((i) => other.has(i))
  }
}
