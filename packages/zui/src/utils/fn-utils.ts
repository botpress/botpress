import * as lodash from 'lodash-es'

/** Sadly, this type is not exported by lodash, so we must redefine it */
type IsEqualCustomizer = (
  value: unknown,
  other: unknown,
  indexOrKey: PropertyKey | undefined,
  parent: unknown,
  otherParent: unknown,
  stack: unknown
) => boolean | undefined

export const isEqual = (a: unknown, b: unknown): boolean => {
  return _isEqualWithVisitedTracking(a, b, new WeakSet())
}

const _isPlainObject = (x: unknown): x is object => lodash.isPlainObject(x)

const _isEqualWithVisitedTracking = (a: unknown, b: unknown, visited: WeakSet<object>): boolean =>
  lodash.isEqualWith(a, b, _customizerWithVisitedTracking(visited))

const _customizerWithVisitedTracking =
  (visited: WeakSet<object>): IsEqualCustomizer =>
  (a, b) => {
    if (_isPlainObject(a) && !visited.has(a) && _isPlainObject(b) && !visited.has(b)) {
      const cleanedA = lodash.omitBy(a as object, lodash.isUndefined)
      const cleanedB = lodash.omitBy(b as object, lodash.isUndefined)

      // Prevent infinite recursion: mark objects as already checked:
      visited.add(cleanedA).add(cleanedB).add(a).add(b)

      return _isEqualWithVisitedTracking(cleanedA, cleanedB, visited)
    }

    return undefined // Offload to default lodash isEqual comparison
  }

export const unique = <T>(arr: T[]): T[] => {
  return Array.from(new Set(arr))
}
