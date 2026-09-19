const TRUNCATE_SIGNATURE = 'llmz.truncate.v1'

export const DEFAULT_TOOL_RESULT_MAX_TOKENS = 2_000

export type TruncatePreserve = 'top' | 'bottom' | 'both'

export type TruncationPolicy = {
  maxTokens: number
  preserve: TruncatePreserve
}

export type Truncated<T> = {
  readonly $$truncate: Readonly<TruncationPolicy & { signature: typeof TRUNCATE_SIGNATURE }>
  readonly value: T
}

/** Sets a display budget without truncating or changing the underlying value. */
export function truncate<T>({
  value,
  maxTokens,
  preserve = 'top',
}: {
  value: T
  maxTokens: number
  preserve?: TruncatePreserve
}): Truncated<T> {
  if (!Number.isSafeInteger(maxTokens) || maxTokens < 0) {
    throw new TypeError('maxTokens must be a finite nonnegative integer')
  }

  if (preserve !== 'top' && preserve !== 'bottom' && preserve !== 'both') {
    throw new TypeError('preserve must be "top", "bottom", or "both"')
  }

  return Object.freeze({
    $$truncate: Object.freeze({ signature: TRUNCATE_SIGNATURE, maxTokens, preserve }),
    value,
  })
}

function ownValue(value: object, key: PropertyKey): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(value, key)
  return descriptor && 'value' in descriptor ? descriptor.value : undefined
}

export function isTruncated(value: unknown): value is Truncated<unknown> {
  if (!value || typeof value !== 'object') {
    return false
  }

  const policy = ownValue(value, '$$truncate')

  if (!policy || typeof policy !== 'object' || !Object.hasOwn(value, 'value')) {
    return false
  }

  const signature = ownValue(policy, 'signature')
  const maxTokens = ownValue(policy, 'maxTokens')
  const preserve = ownValue(policy, 'preserve')
  const valueDescriptor = Object.getOwnPropertyDescriptor(value, 'value')

  return (
    signature === TRUNCATE_SIGNATURE &&
    typeof maxTokens === 'number' &&
    Number.isSafeInteger(maxTokens) &&
    maxTokens >= 0 &&
    (preserve === 'top' || preserve === 'bottom' || preserve === 'both') &&
    !!valueDescriptor &&
    'value' in valueDescriptor
  )
}

function isContainer(value: unknown): value is Record<string, unknown> | unknown[] {
  if (!value || typeof value !== 'object') {
    return false
  }

  const prototype = Object.getPrototypeOf(value)
  return Array.isArray(value) || prototype === Object.prototype || prototype === null
}

/** Removes display wrappers from plain data without changing the wrapped values. */
export function unwrapTruncated<T>(value: Truncated<T>): T
export function unwrapTruncated<T>(value: T): T
export function unwrapTruncated(value: unknown): unknown {
  let underlying: unknown = value
  const rootWrappers = new WeakSet<object>()

  while (isTruncated(underlying)) {
    if (rootWrappers.has(underlying)) {
      throw new TypeError('Circular truncation wrappers cannot be unwrapped')
    }

    rootWrappers.add(underlying)
    underlying = underlying.value
  }

  const visited = new WeakSet<object>()

  function containsWrapper(current: unknown): boolean {
    if (isTruncated(current)) {
      return true
    }

    if (!isContainer(current) || visited.has(current)) {
      return false
    }

    visited.add(current)

    for (const key of Reflect.ownKeys(current)) {
      if (containsWrapper(ownValue(current, key))) {
        return true
      }
    }

    return false
  }

  if (!containsWrapper(underlying)) {
    return underlying
  }

  const copies = new WeakMap<object, unknown>()
  const wrappers = new WeakSet<object>()

  function unwrap(current: unknown): unknown {
    if (current && typeof current === 'object' && copies.has(current)) {
      return copies.get(current)
    }

    if (isTruncated(current)) {
      if (wrappers.has(current)) {
        throw new TypeError('Circular truncation wrappers cannot be unwrapped')
      }

      wrappers.add(current)
      const result = unwrap(current.value)
      wrappers.delete(current)
      copies.set(current, result)
      return result
    }

    if (!isContainer(current)) {
      return current
    }

    const copy = Array.isArray(current) ? new Array(current.length) : Object.create(Object.getPrototypeOf(current))
    copies.set(current, copy)

    for (const key of Reflect.ownKeys(current)) {
      const descriptor = Object.getOwnPropertyDescriptor(current, key)!

      if ('value' in descriptor) {
        descriptor.value = unwrap(descriptor.value)
      }

      Object.defineProperty(copy, key, descriptor)
    }

    return copy
  }

  return unwrap(underlying)
}
