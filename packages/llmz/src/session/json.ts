import { InvalidSessionError } from '../errors.js'
export function stableJSON(value: unknown): string {
  function sortProperties(item: unknown): unknown {
    if (Array.isArray(item)) {
      return item.map(sortProperties)
    }

    if (item && typeof item === 'object') {
      const entries = Object.entries(item).sort(([left], [right]) => left.localeCompare(right))

      return Object.fromEntries(entries.map(([key, child]) => [key, sortProperties(child)]))
    }

    return item
  }

  return JSON.stringify(sortProperties(value))
}

/** Native provider payloads must survive the advertised JSON persistence API. */
export function assertPersistableData(data: unknown): void {
  const seen = new Set<object>()

  function visit(value: unknown): void {
    if (value === undefined || value === null || typeof value === 'string' || typeof value === 'boolean') {
      return
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return
    }

    if (typeof value !== 'object' || seen.has(value)) {
      throw new InvalidSessionError('Native messages and provider continuation must contain finite, acyclic JSON data')
    }

    const array = Array.isArray(value)
    const prototype = Object.getPrototypeOf(value)
    if (!array && prototype !== Object.prototype && prototype !== null) {
      throw new InvalidSessionError(
        'Native provider continuation must use JSON data; encode custom objects or binary data explicitly'
      )
    }

    if (Object.getOwnPropertySymbols(value).length) {
      throw new InvalidSessionError('Native provider continuation cannot contain symbol properties')
    }

    seen.add(value)

    if (array && Object.keys(value).length !== value.length) {
      throw new InvalidSessionError('Native provider continuation arrays must be dense JSON arrays')
    }

    if (array) {
      for (let index = 0; index < value.length; index++) {
        const item = Object.getOwnPropertyDescriptor(value, index)
        if (!item) {
          throw new InvalidSessionError('Native provider continuation arrays must be dense JSON arrays')
        }

        if (!('value' in item)) {
          throw new InvalidSessionError('Native provider continuation must contain plain JSON data properties')
        }

        if (item.value === undefined) {
          throw new InvalidSessionError('Native provider continuation arrays must be dense JSON arrays')
        }
      }
    }

    for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
      if (array && key === 'length') {
        continue
      }

      if (!descriptor.enumerable || descriptor.get || descriptor.set) {
        throw new InvalidSessionError('Native provider continuation must contain plain JSON data properties')
      }

      visit(descriptor.value)
    }

    seen.delete(value)
  }

  visit(data)
}
