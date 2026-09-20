/** Exact, bounded session data. Model-facing previews are never used as stored values. */
export type MemoryValue =
  | null
  | undefined
  | boolean
  | number
  | string
  | MemoryValue[]
  | {
      [key: string]: MemoryValue
    }
export type EncodedMemoryValue =
  | ['negative-zero']
  | ['undefined']
  | ['value', null | boolean | number | string]
  | ['array', EncodedMemoryValue[]]
  | ['object', [string, EncodedMemoryValue][]]

export function encodeMemoryValue(value: unknown, seen = new Set<object>()): EncodedMemoryValue {
  if (value === undefined) {
    return ['undefined']
  }

  if (Object.is(value, -0)) {
    return ['negative-zero']
  }

  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return ['value', value]
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return ['value', value]
  }

  if (typeof value !== 'object') {
    throw new Error(`Unsupported memory value: ${typeof value}`)
  }

  if (seen.has(value)) {
    throw new Error('Cyclic values cannot be retained in memory')
  }

  if (
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) !== Object.prototype &&
    Object.getPrototypeOf(value) !== null
  ) {
    throw new Error('Only plain objects and arrays can be retained in memory')
  }

  if (Object.getOwnPropertySymbols(value).length) {
    throw new Error('Symbol properties cannot be retained in memory')
  }

  seen.add(value)
  try {
    if (Array.isArray(value)) {
      if (Object.keys(value).length !== value.length) {
        throw new Error('Sparse arrays and custom array properties are unsupported')
      }

      const items: EncodedMemoryValue[] = []
      for (let index = 0; index < value.length; index++) {
        const descriptor = Object.getOwnPropertyDescriptor(value, index)
        if (!descriptor || descriptor.get || descriptor.set) {
          throw new Error('Array accessor properties cannot be retained in memory')
        }

        items.push(encodeMemoryValue(descriptor.value, seen))
      }

      return ['array', items]
    }

    const entries: [string, EncodedMemoryValue][] = []
    for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
      if (descriptor.get || descriptor.set) {
        throw new Error('Accessor properties cannot be retained in memory')
      }

      if (!descriptor.enumerable) {
        throw new Error('Non-enumerable properties cannot be retained in memory')
      }

      entries.push([key, encodeMemoryValue(descriptor.value, seen)])
    }

    return ['object', entries]
  } finally {
    seen.delete(value)
  }
}

export function decodeMemoryValue(value: EncodedMemoryValue): MemoryValue {
  if (!Array.isArray(value)) {
    throw new Error('Invalid serialized memory value')
  }

  const tag = value[0]
  if (value.length !== (tag === 'negative-zero' || tag === 'undefined' ? 1 : 2)) {
    throw new Error('Invalid serialized memory tuple')
  }

  switch (tag) {
    case 'negative-zero':
      return -0
    case 'undefined':
      return undefined
    case 'value': {
      const primitive = value[1]
      if (
        primitive === null ||
        typeof primitive === 'string' ||
        typeof primitive === 'boolean' ||
        (typeof primitive === 'number' && Number.isFinite(primitive))
      ) {
        return primitive
      }

      throw new Error('Invalid serialized primitive')
    }
    case 'array':
      if (!Array.isArray(value[1])) {
        throw new Error('Invalid serialized array')
      }
      return Array.from(value[1], decodeMemoryValue)
    case 'object': {
      if (!Array.isArray(value[1])) {
        throw new Error('Invalid serialized object')
      }

      const keys = new Set<string>()
      const entries = Array.from(value[1], (entry): [string, MemoryValue] => {
        if (!Array.isArray(entry) || entry.length !== 2 || typeof entry[0] !== 'string' || keys.has(entry[0])) {
          throw new Error('Invalid or duplicate serialized object property')
        }

        keys.add(entry[0])
        return [entry[0], decodeMemoryValue(entry[1])]
      })
      return Object.fromEntries(entries)
    }
    default:
      throw new Error('Unknown serialized memory value')
  }
}

export const cloneMemoryValue = (value: unknown): MemoryValue => decodeMemoryValue(encodeMemoryValue(value))
export function freezeMemoryValue<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) {
      freezeMemoryValue(child)
    }

    Object.freeze(value)
  }

  return value
}
