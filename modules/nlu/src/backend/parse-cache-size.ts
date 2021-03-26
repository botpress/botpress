import bytes from 'bytes'

const DEFAULT_CACHE_SIZE = Infinity

export const parseCacheSize = (cacheSize: string | undefined): number => {
  if (!cacheSize) {
    return DEFAULT_CACHE_SIZE
  }

  const parsedCacheSize = bytes(cacheSize)
  if (!parsedCacheSize) {
    // can be nan
    return DEFAULT_CACHE_SIZE
  }

  return Math.abs(parsedCacheSize)
}
