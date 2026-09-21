import fs from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CACHE_USAGE_ENV, CacheUsageRun, markCacheIncomplete, markCacheUsed, withCacheLock } from './cache-usage.js'

let directory: string
let cache: string
let run: CacheUsageRun | undefined
const used = { key: 'same-key', value: 'used response' }
const unused = { key: 'same-key', value: 'older response' }
const line = (entry: unknown) => JSON.stringify(entry) + '\n'

beforeEach(() => {
  directory = fs.mkdtempSync(path.join(tmpdir(), 'cache-usage-test-'))
  cache = path.join(directory, 'cache.jsonl')
  fs.writeFileSync(cache, line(unused) + line(used))
})
afterEach(() => {
  run?.dispose()
  run = undefined
  vi.unstubAllEnvs()
  fs.rmSync(directory, { recursive: true, force: true })
})
function start() {
  run = new CacheUsageRun(cache)
  vi.stubEnv(CACHE_USAGE_ENV, run.journal)
  return run
}

describe('cache usage sweep', () => {
  it('keeps the exact used recording, not every entry sharing its request key', () => {
    const current = start()
    markCacheUsed(cache, used)
    markCacheUsed(cache, used)
    expect(current.prune()).toEqual({ kept: 1, removed: 1 })
    expect(fs.readFileSync(cache, 'utf8')).toBe(line(used))
  })

  it('preserves new recordings appended during the run, including another writer', () => {
    const current = start()
    markCacheUsed(cache, used)
    const added = { key: 'new', value: 'another run' }
    withCacheLock(cache, () => fs.appendFileSync(cache, line(added)))
    current.prune()
    expect(fs.readFileSync(cache, 'utf8')).toBe(line(used) + line(added))
  })

  it('preserves downstream recordings when a request could not be fulfilled', () => {
    const current = start()
    markCacheUsed(cache, used)
    markCacheIncomplete(cache)
    expect(current.prune()).toBeUndefined()
    expect(fs.readFileSync(cache, 'utf8')).toBe(line(unused) + line(used))
  })

  it('does nothing without usage for this cache, even if another cache was used', () => {
    const current = start()
    markCacheUsed(path.join(directory, 'other.jsonl'), used)
    expect(current.prune()).toBeUndefined()
    expect(fs.readFileSync(cache, 'utf8')).toBe(line(unused) + line(used))
  })

  it('does not prune a cache that was replaced during the run', () => {
    const current = start()
    markCacheUsed(cache, used)
    fs.writeFileSync(cache, line(unused))
    expect(current.prune()).toBeUndefined()
    expect(fs.readFileSync(cache, 'utf8')).toBe(line(unused))
  })

  it('skips pruning while a writer holds the lock and releases locks on errors', () => {
    const current = start()
    markCacheUsed(cache, used)
    withCacheLock(cache, () => expect(current.prune()).toBeUndefined())
    expect(() =>
      withCacheLock(cache, () => {
        throw new Error('failure')
      })
    ).toThrow('failure')
    expect(current.prune()).toEqual({ kept: 1, removed: 1 })
  })

  it('preserves malformed cache lines and refuses a malformed usage journal', () => {
    fs.appendFileSync(cache, '{unfinished')
    const current = start()
    markCacheUsed(cache, used)
    fs.appendFileSync(current.journal, '{unfinished')
    expect(() => current.prune()).toThrow()
    expect(fs.readFileSync(cache, 'utf8')).toBe(line(unused) + line(used) + '{unfinished')
    fs.writeFileSync(current.journal, '')
    markCacheUsed(cache, used)
    current.prune()
    expect(fs.readFileSync(cache, 'utf8')).toBe(line(used) + '{unfinished')
  })
})
