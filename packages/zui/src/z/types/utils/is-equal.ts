import * as lodash from 'lodash-es'

/** Sadly, this type is not exported by lodash, so we must redefine it */
type IsEqualCustomizer = (
  value: any,
  other: any,
  indexOrKey: PropertyKey | undefined,
  parent: any,
  otherParent: any,
  stack: any,
) => boolean | undefined

export const isEqual = (a: any, b: any): boolean => {
  return _isEqualWithVisitedTracking(a, b, new WeakSet())
}

const _isEqualWithVisitedTracking = (a: any, b: any, visited: WeakSet<any>): boolean =>
  lodash.isEqualWith(a, b, _customizerWithVisitedTracking(visited))

const _customizerWithVisitedTracking =
  (visited: WeakSet<any>): IsEqualCustomizer =>
  (a, b) => {
    if (lodash.isPlainObject(a) && !visited.has(a) && lodash.isPlainObject(b) && !visited.has(b)) {
      const cleanedA = lodash.omitBy(a, lodash.isUndefined)
      const cleanedB = lodash.omitBy(b, lodash.isUndefined)

      // Prevent infinite recursion: mark objects as already checked:
      visited.add(cleanedA).add(cleanedB).add(a).add(b)

      return _isEqualWithVisitedTracking(cleanedA, cleanedB, visited)
    }

    return undefined // Offload to default lodash isEqual comparison
  }
