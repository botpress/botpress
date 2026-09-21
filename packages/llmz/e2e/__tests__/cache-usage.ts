import { createHash } from 'node:crypto'
import fs from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

export const CACHE_USAGE_ENV = 'LLMZ_E2E_CACHE_USAGE'

function fingerprint(entry: unknown): string {
  return createHash('sha256').update(JSON.stringify(entry)).digest('hex')
}

/** A separate journal avoids rewriting the response cache on every hit. */
export function markCacheUsed(cache: string, entry: unknown): void {
  const journal = process.env[CACHE_USAGE_ENV]
  if (journal) {
    fs.appendFileSync(journal, JSON.stringify({ cache: path.resolve(cache), entry: fingerprint(entry) }) + '\n')
  }
}

/** A request failure leaves downstream cache coverage unknown, even when all tests finish. */
export function markCacheIncomplete(cache: string): void {
  const journal = process.env[CACHE_USAGE_ENV]
  if (journal) {
    fs.appendFileSync(journal, JSON.stringify({ cache: path.resolve(cache), incomplete: true }) + '\n')
  }
}

/** Coordinate append and sweep so an atomic replacement cannot lose a concurrent append. */
export function withCacheLock<T>(cache: string, action: () => T): { value: T } | undefined {
  fs.mkdirSync(path.dirname(cache), { recursive: true })
  const lock = `${cache}.lock`
  let fd: number
  try {
    fd = fs.openSync(lock, 'wx')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') return undefined
    throw error
  }
  try {
    return { value: action() }
  } finally {
    fs.closeSync(fd)
    fs.unlinkSync(lock)
  }
}

/** Owns one run's initial snapshot and usage journal. Failed assertions still mark entries. */
export class CacheUsageRun {
  public readonly journal: string
  private readonly _directory: string
  private readonly _snapshot: string
  private readonly _cache: string

  public constructor(cache: string) {
    this._cache = path.resolve(cache)
    this._snapshot = fs.existsSync(this._cache) ? fs.readFileSync(this._cache, 'utf8') : ''
    this._directory = fs.mkdtempSync(path.join(tmpdir(), 'llmz-cache-usage-'))
    this.journal = path.join(this._directory, 'used.jsonl')
    fs.writeFileSync(this.journal, '')
  }

  public prune(): { kept: number; removed: number } | undefined {
    const used = new Set<string>()
    for (const line of fs.readFileSync(this.journal, 'utf8').split('\n').filter(Boolean)) {
      const record = JSON.parse(line)
      if (record.cache === this._cache && record.incomplete === true) return undefined
      if (typeof record.cache !== 'string' || typeof record.entry !== 'string') {
        throw new Error('Invalid cache usage journal; cache was not pruned.')
      }
      if (record.cache === this._cache) used.add(record.entry)
    }
    if (!used.size || !this._snapshot) return undefined

    return withCacheLock(this._cache, () => {
      const current = fs.readFileSync(this._cache, 'utf8')
      // Another run may append recordings, but replacing/editing the snapshot
      // invalidates our view. New recordings are always preserved.
      if (!current.startsWith(this._snapshot)) return undefined
      const lines = this._snapshot.match(/[^\n]*\n|[^\n]+$/g) ?? []
      let kept = 0
      let removed = 0
      const retained = lines.filter((line) => {
        if (!line.trim()) return true
        try {
          if (used.has(fingerprint(JSON.parse(line)))) {
            kept++
            return true
          }
          removed++
          return false
        } catch {
          // An interrupted recording is not evidence that this line is unused.
          return true
        }
      })
      if (removed) {
        const temporary = `${this._cache}.${process.pid}.tmp`
        try {
          fs.writeFileSync(temporary, retained.join('') + current.slice(this._snapshot.length), { flag: 'wx' })
          fs.renameSync(temporary, this._cache)
        } finally {
          fs.rmSync(temporary, { force: true })
        }
      }
      return { kept, removed }
    })?.value
  }

  public dispose(): void {
    fs.rmSync(this._directory, { recursive: true, force: true })
  }
}
